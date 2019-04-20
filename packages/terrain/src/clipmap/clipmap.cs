using System;
using System.Collections.Generic;
using SharpDX;
using SharpDX.Toolkit.Graphics;
using System.Linq;

namespace GeometryClipmaps
{
    public class Clipmap
    {
        /// <summary>
        /// The clipmap with coarser level of detail
        /// </summary>
        public Clipmap CoarserClip { get; set; }

        /// <summary>
        /// The clipmap with finer level of detail
        /// </summary>
        public Clipmap FinerClip { get; set; }

        /// <summary>
        /// Gets the levelindex of this clip. A clip with Level = 0 is the clip with the most details.
        /// </summary>
        public int Level { get; private set; }

        /// <summary>
        /// Gets the number of units between vertices. This value is always <c>2 ^ Level</c>.
        /// A clip with Density = 1 is the clip with the highest vertex density and has the most details.
        /// </summary>
        public int Density { get; private set; }

        /// <summary>
        /// Gets the number of vertices per side of the clip. This is always one less than
        /// power of two (2^x - 1).
        /// </summary>
        public int Clipsize { get; private set; }

        /// <summary>
        /// Gets and sets tileArea value indicating whether this clipmap is active for rendering
        /// </summary>
        public bool Active { get; set; }

        /// <summary>
        /// The height map for this level
        /// </summary>
        public RenderTarget2D ElevationMap { get; private set; }

        /// <summary>
        /// The normal map for this level
        /// </summary>
        public RenderTarget2D NormalMap { get; private set; }

        /// <summary>
        /// The clipmap center position in world space. This is snapped to
        /// the <see cref="Density"/> of the coarser level
        /// </summary>
        public Vector2 Center { get; private set; }

        /// <summary>
        /// The clipmap origin position in world space. This is the upper left
        /// corner of the clip area.
        /// </summary>
        public Vector2 Origin { get; private set; }

        /// <summary>
        /// The movement delta since last update
        /// </summary>
        public Vector2 Delta { get; private set; }

        /// <summary>
        /// Flags indicating what geometry castedPatches of this clip are visible
        /// and should be rendered
        /// </summary>
        public GeometryFootprint Footprints { get; private set; }

        public Rectangle WorldArea { get; private set; }

        /// <summary>
        ///
        /// </summary>
        public List<ClipUpdateParams> UpdateParams { get; private set; }

        private bool firstUpdate = true;
        private TileLayer tileLayer;
        private List<Tile> castedTiles = new List<Tile>();
        private List<Rectangle> invalidAreas = new List<Rectangle>();

        private Clipmap(TileManager tileManager, int level, ClipSize clipsize, int normalFactor)
        {
            this.tileLayer = tileManager.GetLayer(level);
            this.tileLayer.TileChanged += (sender, e) =>
            {
                InvalidateArea(e.Tile.Area);
            };

            this.UpdateParams = new List<ClipUpdateParams>();
            this.invalidAreas = new List<Rectangle>();

            this.Level = level;
            this.Clipsize = (int)clipsize;
            this.Density = (int)Math.Pow(2, level);

            int eSize = Clipsize;
            int nSize = eSize * normalFactor;
            this.ElevationMap = RenderTarget2D.New(tileManager.GraphicsDevice, eSize, eSize, PixelFormat.R16G16.Float, TextureFlags.RenderTarget | TextureFlags.ShaderResource, 1);
            this.NormalMap = RenderTarget2D.New(tileManager.GraphicsDevice, nSize, nSize, PixelFormat.R16G16B16A16.Float, TextureFlags.RenderTarget | TextureFlags.ShaderResource, 1);
            this.Center = Vector2.Zero;

            Footprints =
                GeometryFootprint.MxM_01 |
                GeometryFootprint.MxM_02 |
                GeometryFootprint.MxM_03 |
                GeometryFootprint.MxM_04 |
                GeometryFootprint.MxM_05 |
                GeometryFootprint.MxM_06 |
                GeometryFootprint.MxM_07 |
                GeometryFootprint.MxM_08 |
                GeometryFootprint.MxM_09 |
                GeometryFootprint.MxM_10 |
                GeometryFootprint.MxM_11 |
                GeometryFootprint.MxM_12 |
                GeometryFootprint.RingFixup;
        }

        public void UpdateCenter(Vector3 viewPosition)
        {
            // We are interested in the integral part of the cameras position
            int cx = (int)viewPosition.X;
            int cy = (int)viewPosition.Z;

            this.Active = true;
            //this.Active = viewPosition.Y < Density * Clipsize;
            if (CoarserClip == null)
                this.Active = true;
            else if (!CoarserClip.Active)
                this.Active = false;

            DetectMovement(cx, cy);
            DetectVisibleGeometry(cx, cy);
            DetectInvalidArea();
            this.tileLayer.Update(WorldArea);
            DetectUpdateParams();
        }

        public void InvalidateArea(Rectangle area)
        {
            if (this.WorldArea.Intersects(area))
            {
                invalidAreas.Add(Rectangle.Intersect(this.WorldArea, area));
            }
        }

        private void DetectMovement(int camX, int camY)
        {
            // Snap the center of this level to the grid density
            // of the next coarser level. Math.Floor() is used to
            // achieve consistent snap behavior for negaitve and
            // positive coordinates.
            float d2 = Density * 2;
            int snapX = (int)(Math.Floor(camX / d2) * d2);
            int snapY = (int)(Math.Floor(camY / d2) * d2);

            var center = new Vector2(snapX + Density, snapY + Density);
            this.Delta = center - Center;
            this.Center = center;

            this.Origin = Center - new Vector2(Clipsize / 2) * Density;
            this.WorldArea = new Rectangle((int)Origin.X, (int)Origin.Y, Clipsize * Density, Clipsize * Density);
        }

        private void DetectVisibleGeometry(int camX, int camY)
        {
            // Determine whether the camera center is odd or even
            // on the grid of this level
            float d = Density;
            int modX = (int)(Math.Floor(camX / d)) % 2;
            int modY = (int)(Math.Floor(camY / d)) % 2;

            // Deactivate all interior trims
            Footprints = Footprints & ~GeometryFootprint.InteriorTop;
            Footprints = Footprints & ~GeometryFootprint.InteriorRight;
            Footprints = Footprints & ~GeometryFootprint.InteriorBottom;
            Footprints = Footprints & ~GeometryFootprint.InteriorLeft;
            Footprints = Footprints & ~GeometryFootprint.Inner1;
            Footprints = Footprints & ~GeometryFootprint.Inner2;
            Footprints = Footprints & ~GeometryFootprint.Inner3;
            Footprints = Footprints & ~GeometryFootprint.Inner4;
            Footprints = Footprints & ~GeometryFootprint.Inner5;
            Footprints = Footprints & ~GeometryFootprint.OuterDegenerate;

            if (FinerClip == null || !FinerClip.Active)
            {
                Footprints |= GeometryFootprint.Inner1;
                Footprints |= GeometryFootprint.Inner2;
                Footprints |= GeometryFootprint.Inner3;
                Footprints |= GeometryFootprint.Inner4;
                Footprints |= GeometryFootprint.Inner5;
            }
            else
            {
                // Determine active interior trims
                Footprints |= (modX == 0) ? GeometryFootprint.InteriorRight : GeometryFootprint.InteriorLeft;
                Footprints |= (modY == 0) ? GeometryFootprint.InteriorBottom : GeometryFootprint.InteriorTop;
            }

            if (CoarserClip != null)
            {
                Footprints |= GeometryFootprint.OuterDegenerate;
            }
        }

        private void DetectInvalidArea()
        {
            this.invalidAreas.Clear();

            // Convert clipsize from "number of vertices per clipside" to
            // "number of worldspace units per clipside"
            int size = Clipsize * Density;

            // Make sure that we don't update more than needed,
            // e.g. when camera makes tileArea distant jump.
            int dx = (int)MathUtil.Clamp(Delta.X, -size, size);
            int dy = (int)MathUtil.Clamp(Delta.Y, -size, size);

            // Origin is the upper left corner of the current clip in world space units
            int ox = (int)Origin.X;
            int oy = (int)Origin.Y;

            // Update the whole clip area on first update
            if (firstUpdate)
            {
                firstUpdate = false;
                InvalidateArea(new Rectangle(ox, oy, size, size));
                return;
            }

            // The clip has moved along the delta vector. Find the L shaped area in
            // worldspace, that just appeared to be visible for this clip

            // horizontal area
            if (dx > 0)
            {
                InvalidateArea(new Rectangle(ox + size - dx, oy, dx, size));
            }
            else if (dx < 0)
            {
                InvalidateArea(new Rectangle(ox, oy, -dx, size));
            }

            // vertical area
            if (dy > 0)
            {
                InvalidateArea(new Rectangle(ox, oy + size - dy, size, dy));
            }
            else if (dy < 0)
            {
                InvalidateArea(new Rectangle(ox, oy, size, -dy));
            }
        }

        private void DetectUpdateParams()
        {
            UpdateParams.Clear();

            foreach (var invalidArea in invalidAreas)
            {
                this.castedTiles.Clear();
                this.tileLayer.CastArea(invalidArea, this.castedTiles);
                foreach (var tile in this.castedTiles)
                {
                    this.DetectUpdateParams(tile);
                }
            }
        }

        private void DetectUpdateParams(Tile tile)
        {
            Rectangle sourceArea = Rectangle.Intersect(WorldArea, tile.Area);

            if (sourceArea.Width <= 0 || sourceArea.Height <= 0)
            {
                return;
            }

            // Just tileArea rectangle with the pixel bounds of the render target.
            // This is where we write texture with toroidal wraparound.
            var targetBounds = new RectangleF(0, 0, Clipsize, Clipsize);

            // Bring source positions into render target bounds.
            // Therefore wrap the origin around the Clipsize.
            var targetArea = new RectangleF()
            {
                X = MathUtil.Wrap(sourceArea.X / Density, 0, Clipsize),
                Y = MathUtil.Wrap(sourceArea.Y / Density, 0, Clipsize),
                Width = sourceArea.Width / Density,
                Height = sourceArea.Height / Density
            };

            // Find the area in the coarser render target for the exact same
            // source positions.
            float d2 = Density * 2;
            var coarseArea = new RectangleF()
            {
                X = MathUtil.Wrap(sourceArea.X / d2, 0, Clipsize),
                Y = MathUtil.Wrap(sourceArea.Y / d2, 0, Clipsize),
                Width = (sourceArea.Width / d2),
                Height = (sourceArea.Height / d2)
            };

            ClipUpdateParams result;
            var sArea = new Rectangle()
            {
                X = sourceArea.X / Density,
                Y = sourceArea.Y / Density,
                Width = sourceArea.Width / Density,
                Height = sourceArea.Height / Density,
            };

            result.SourceArea = sArea;
            result.CoarseArea = coarseArea;
            result.Tile = tile;

            if (targetBounds.Intersects(targetArea))
            {
                result.TargetArea = targetArea;
                UpdateParams.Add(result);
            }

            targetArea.X -= Clipsize;
            if (targetBounds.Intersects(targetArea))
            {
                result.TargetArea = targetArea;
                UpdateParams.Add(result);
            }

            targetArea.Y -= Clipsize;
            if (targetBounds.Intersects(targetArea))
            {
                result.TargetArea = targetArea;
                UpdateParams.Add(result);
            }

            targetArea.X += Clipsize;
            if (targetBounds.Intersects(targetArea))
            {
                result.TargetArea = targetArea;
                UpdateParams.Add(result);
            }
        }

        public static List<Clipmap> CreateList(TileManager tileManager, int numLevels, ClipSize clipsize, int normalFactor)
        {
            if (normalFactor != 1 && normalFactor != 2 && normalFactor != 4 && normalFactor != 8 && normalFactor != 16 && normalFactor != 32)
            {
                throw new ArgumentException("normalScale must be one of 1, 2, 4, 8 or 16");
            }

            var clips = new List<Clipmap>(numLevels);
            for (int i = 0; i < numLevels; i++)
            {
                clips.Add(new Clipmap(tileManager, i, clipsize, normalFactor));
            }
            for (int i = 0; i < numLevels; i++)
            {
                if (i < numLevels - 1)
                {
                    clips[i].CoarserClip = clips[i + 1];
                }
                if (i > 0)
                {
                    clips[i].FinerClip = clips[i - 1];
                }
            }
            return clips;
        }
    }
}

using System;
using System.Collections.Generic;
using SharpDX;
using SharpDX.Toolkit;
using SharpDX.Toolkit.Input;
using SharpDX.Toolkit.Graphics;

namespace GeometryClipmaps
{
    public class ClipmapSystem : GameSystem
    {
        // The used camera.
        private Camera camera;

        // Scaling of the height values. Usually to scale from [0:1] to [0:Scale]
        private float Scale = 512;

        // Number of clipmap geometry levels to create.
        private int ClipLevels = 5;

        // Factor by what the normal map is larger than the elvation map that
        // is used for each level. Must be one of 1, 2 or 4
        private int NormalFactor = 1;

        // Number of vertices per clipmap side.
        private ClipSize Clipsize = ClipSize.N0511;

        private GeometryCollection geometries;
        private List<Clipmap> clips;
        private SpriteBatch spriteBatch;
        private TileManager tileManager;

        // Graphical resources.
        private Effect effectRender;
        private Effect effectUpdate;
        private ScreenQuad quad;

        // Debug variables
        private RenderFlags colorScheme = RenderFlags.Textured;
        private IKeyboardService keboard;
        private bool lightOn = true;
        private bool showBlend = false;
        private bool wireframe = false;
        private bool saveScreen = false;
        private bool saveTargets = false;
        private int showClips = -1;
        private RasterizerState wireframeState;
        private bool updateCenter = true;
        private bool degenerates = false;

        /// <summary>
        /// Creates tileArea terraincomponent that can update and draw terrain.
        /// </summary>
        /// <param name="game"></param>
        public ClipmapSystem(Game game)
            : base(game)
        {
            base.Enabled = true;
            base.Visible = true;
        }

        public override void Initialize()
        {
            // get camera that is tileArea registered service.
            camera = Game.Services.GetService(typeof(Camera)) as Camera;

            if (camera == null)
            {
                throw new InvalidOperationException("Camera service not found.");
            }

            keboard = Game.Services.GetService(typeof(IKeyboardService)) as IKeyboardService;

            if (keboard == null)
            {
                throw new InvalidOperationException("IKeyboardService not found.");
            }

            base.Initialize();
        }

        protected override void LoadContent()
        {
            var d = GraphicsDevice.RasterizerStates.WireFrame.Description;
            d.DepthBias = -50;
            wireframeState = RasterizerState.New(GraphicsDevice, d);

            spriteBatch = new SpriteBatch(GraphicsDevice);
            quad = new ScreenQuad(GraphicsDevice);

            // load effect and texture
            effectRender = Game.Content.Load<Effect>("Render");
            effectUpdate = Game.Content.Load<Effect>("Update");

            var tex1 = Game.Content.Load<Texture2D>("dif_sand.dds");
            var tex2 = Game.Content.Load<Texture2D>("dif_moss.dds");
            var tex3 = Game.Content.Load<Texture2D>("dif_dirt.dds");
            var tex4 = Game.Content.Load<Texture2D>("dif_ice.dds");
            var tex5 = Game.Content.Load<Texture2D>("dif_rock.dds");

            var nrm1 = Game.Content.Load<Texture2D>("nrm_sand.dds");
            var nrm2 = Game.Content.Load<Texture2D>("nrm_moss.dds");
            var nrm3 = Game.Content.Load<Texture2D>("nrm_dirt.dds");
            var nrm4 = Game.Content.Load<Texture2D>("nrm_ice.dds");
            var nrm5 = Game.Content.Load<Texture2D>("nrm_rock.dds");

            effectRender.Parameters["Tex1"].TrySetResource(tex1);
            effectRender.Parameters["Tex2"].TrySetResource(tex2);
            effectRender.Parameters["Tex3"].TrySetResource(tex3);
            effectRender.Parameters["Tex4"].TrySetResource(tex4);
            effectRender.Parameters["Tex5"].TrySetResource(tex5);

            effectRender.Parameters["Nrm1"].TrySetResource(nrm1);
            effectRender.Parameters["Nrm2"].TrySetResource(nrm2);
            effectRender.Parameters["Nrm3"].TrySetResource(nrm3);
            effectRender.Parameters["Nrm4"].TrySetResource(nrm4);
            effectRender.Parameters["Nrm5"].TrySetResource(nrm5);

            effectRender.Parameters["DiffuseSampler"].TrySetResource(GraphicsDevice.SamplerStates.LinearWrap);

            // Create and initialize the clipmaplevels.
            geometries = new GeometryCollection(Clipsize, GraphicsDevice);
            tileManager = new ProceduralTileManager(GraphicsDevice, ClipLevels);
            clips = Clipmap.CreateList(tileManager, ClipLevels, Clipsize, NormalFactor);

            base.LoadContent();
        }

        #region Update
        KeyboardState oldState;
        public override void Update(GameTime gameTime)
        {
            var state = keboard.GetState();
            if (state.IsKeyDown(Keys.F1))
            {
                colorScheme = RenderFlags.Textured;
            }
            if (state.IsKeyDown(Keys.F2))
            {
                colorScheme = RenderFlags.PatchColors;
            }
            if (state.IsKeyDown(Keys.F3))
            {
                colorScheme = RenderFlags.ElevationMap;
            }
            if (state.IsKeyDown(Keys.F4))
            {
                colorScheme = RenderFlags.NormalMap;
            }
            if (state.IsKeyDown(Keys.F5))
            {
                colorScheme = RenderFlags.LightMap;
            }
            if (state.IsKeyDown(Keys.F6) && oldState.IsKeyUp(Keys.F6))
            {
                lightOn = !lightOn;
            }
            if (state.IsKeyDown(Keys.F7) && oldState.IsKeyUp(Keys.F7))
            {
                showBlend = !showBlend;
            }
            if (state.IsKeyDown(Keys.F8) && oldState.IsKeyUp(Keys.F8))
            {
                wireframe = !wireframe;
            }
            if (state.IsKeyDown(Keys.F11))
            {
                saveTargets = true;
            }
            if (state.IsKeyDown(Keys.F12))
            {
                saveScreen = true;
            }


            if (state.IsKeyDown(Keys.Tab) && oldState.IsKeyUp(Keys.Tab))
            {
                showClips = showClips < 0 ? 0 : - 1;
            }
            if (state.IsKeyDown(Keys.D0) || state.IsKeyDown(Keys.NumPad0))
            {
                showClips = 0;
            }
            if (state.IsKeyDown(Keys.D1) || state.IsKeyDown(Keys.NumPad1))
            {
                showClips = 1;
            }
            if (state.IsKeyDown(Keys.D2) || state.IsKeyDown(Keys.NumPad2))
            {
                showClips = 2;
            }
            if (state.IsKeyDown(Keys.D3) || state.IsKeyDown(Keys.NumPad3))
            {
                showClips = 3;
            }
            if (state.IsKeyDown(Keys.D4) || state.IsKeyDown(Keys.NumPad4))
            {
                showClips = 4;
            }
            if (state.IsKeyDown(Keys.D5) || state.IsKeyDown(Keys.NumPad5))
            {
                showClips = 5;
            }
            if (state.IsKeyDown(Keys.D6) || state.IsKeyDown(Keys.NumPad6))
            {
                showClips = 6;
            }
            if (state.IsKeyDown(Keys.D7) || state.IsKeyDown(Keys.NumPad7))
            {
                showClips = 7;
            }
            if (state.IsKeyDown(Keys.D8) || state.IsKeyDown(Keys.NumPad8))
            {
                showClips = 8;
            }
            if (state.IsKeyDown(Keys.D9) || state.IsKeyDown(Keys.NumPad9))
            {
                showClips = 9;
            }
            if (state.IsKeyDown(Keys.C) && oldState.IsKeyUp(Keys.C))
            {
                updateCenter = !updateCenter;
            }
            if (state.IsKeyDown(Keys.V) && oldState.IsKeyUp(Keys.V))
            {
                degenerates = !degenerates;
            }
            oldState = state;
            base.Update(gameTime);
        }
        #endregion

        public override void Draw(GameTime gameTime)
        {
            tileManager.DispatchLoadOperations();

            // Update clip algorithm based on camera position
            // - Updates new clip position
            // - Detects regions that needs to be updated
            for (int i = 0; i < clips.Count; i++)
            {
                if (updateCenter)
                    clips[i].UpdateCenter(camera.World.TranslationVector);
            }

            // Update elevation and normal maps
            UpdateRenderTargets();

            // We render to the backbuffer now. Set the back and depth buffer to the device
            // This unbinds all previous rendertargets that were used in earlier steps.
            GraphicsDevice.SetRenderTargets(GraphicsDevice.DepthStencilBuffer, GraphicsDevice.BackBuffer);
            GraphicsDevice.Clear(Color.CornflowerBlue);

            // Set common rendering states
            GraphicsDevice.SetRasterizerState(GraphicsDevice.RasterizerStates.CullBack);
            GraphicsDevice.SetDepthStencilState(GraphicsDevice.DepthStencilStates.Default);
            GraphicsDevice.SetBlendState(GraphicsDevice.BlendStates.Opaque);

            // preapare effect
            effectRender.Parameters["View"].SetValue(camera.View);
            effectRender.Parameters["Projection"].SetValue(camera.Projection);
            if (updateCenter)
                effectRender.Parameters["EyePosition"].SetValue(camera.World.TranslationVector);

            effectRender.Parameters["ColorScheme"].SetValue<int>((int)colorScheme);
            effectRender.Parameters["LightOn"].SetValue<bool>(lightOn);
            effectRender.Parameters["ShowBlend"].SetValue<bool>(showBlend);
            effectRender.Parameters["Wireframe"].SetValue<bool>(false);

            // Draw the geometry
            DrawClipmapGeometry();
            if (wireframe)
            {
                // Draw wireframe on top with tileArea slight depth offset
                GraphicsDevice.SetRasterizerState(wireframeState);
                GraphicsDevice.SetDepthStencilState(GraphicsDevice.DepthStencilStates.DepthRead);
                GraphicsDevice.SetBlendState(GraphicsDevice.BlendStates.Opaque);

                effectRender.Parameters["Wireframe"].SetValue<bool>(true);
                DrawClipmapGeometry();
            }

            DrawClipmapSprites(showClips);

            MakeScreenshot();

            base.Draw(gameTime);
        }

        private void UpdateRenderTargets()
        {
            GraphicsDevice.SetDepthStencilState(GraphicsDevice.DepthStencilStates.None);
            GraphicsDevice.SetRasterizerState(GraphicsDevice.RasterizerStates.CullNone);
            GraphicsDevice.SetBlendState(GraphicsDevice.BlendStates.Opaque);

            effectUpdate.CurrentTechnique = effectUpdate.Techniques["UpdateElevation"];

            effectUpdate.Parameters["SourceSampler"].TrySetResource(GraphicsDevice.SamplerStates.PointClamp);
            effectUpdate.Parameters["CoarseSampler"].TrySetResource(GraphicsDevice.SamplerStates.PointWrap);

            for (int i = clips.Count - 1; i >= 0; i--)
            {
                var clip = clips[i];

                GraphicsDevice.SetRenderTargets(clip.ElevationMap);
                effectUpdate.Parameters["TargetScale"].SetValue((float)clip.Clipsize / (float)clip.ElevationMap.Width);
                effectUpdate.Parameters["TargetTexel"].SetValue<Vector2>(clip.ElevationMap.GetTexel());
                effectUpdate.Parameters["CoarseAvailable"].SetValue(clip.CoarserClip != null);
                effectUpdate.Parameters["Density"].SetValue<float>(clip.Density);

                if (clip.CoarserClip != null)
                {
                    effectUpdate.Parameters["CoarseNormals"].TrySetResource(clip.CoarserClip.NormalMap);
                    effectUpdate.Parameters["CoarseTexture"].TrySetResource(clip.CoarserClip.ElevationMap);
                    effectUpdate.Parameters["CoarseTexel"].SetValue<Vector2>(clip.CoarserClip.ElevationMap.GetTexel());
                }

                foreach (var updateParam in clip.UpdateParams)
                {
                    effectUpdate.Parameters["SourceTexture"].TrySetResource(updateParam.Tile.Texture);
                    effectUpdate.Parameters["SourceTexel"].SetValue<Vector2>(updateParam.Tile.TextureTexel);
                    effectUpdate.Parameters["TileTexel"].SetValue<Vector2>(updateParam.Tile.TileTexel);
                    effectUpdate.Parameters["SourceAvailable"].SetValue<bool>(updateParam.Tile.IsSynced);

                    effectUpdate.Parameters["SourceArea"].SetValue<Vector4>(updateParam.SourceArea.ToVector4());
                    effectUpdate.Parameters["CoarseArea"].SetValue<Vector4>(updateParam.CoarseArea.ToVector4());
                    effectUpdate.Parameters["TargetArea"].SetValue<Vector4>(updateParam.TargetArea.ToVector4());
                    quad.Draw(effectUpdate);
                }
            }

            effectUpdate.CurrentTechnique = effectUpdate.Techniques["UpdateNormals"];

            effectUpdate.Parameters["SourceSampler"].TrySetResource(GraphicsDevice.SamplerStates.LinearClamp);
            effectUpdate.Parameters["CoarseSampler"].TrySetResource(GraphicsDevice.SamplerStates.PointWrap);

            for (int i = clips.Count - 1; i >= 0; i--)
            {
                var clip = clips[i];

                GraphicsDevice.SetRenderTargets(clip.NormalMap);
                effectUpdate.Parameters["TargetScale"].SetValue((float)clip.Clipsize / (float)clip.NormalMap.Width);
                effectUpdate.Parameters["TargetTexel"].SetValue<Vector2>(clip.ElevationMap.GetTexel());
                effectUpdate.Parameters["CoarseAvailable"].SetValue(clip.CoarserClip != null);
                effectUpdate.Parameters["Density"].SetValue<float>(clip.Density);

                if (clip.CoarserClip != null)
                {
                    effectUpdate.Parameters["CoarseNormals"].TrySetResource(clip.CoarserClip.NormalMap);
                    effectUpdate.Parameters["CoarseTexture"].TrySetResource(clip.CoarserClip.ElevationMap);
                    effectUpdate.Parameters["CoarseTexel"].SetValue<Vector2>(clip.CoarserClip.ElevationMap.GetTexel());
                }


                foreach (var updateParam in clip.UpdateParams)
                {
                    effectUpdate.Parameters["SourceTexture"].TrySetResource(updateParam.Tile.Texture);
                    effectUpdate.Parameters["SourceTexel"].SetValue<Vector2>(updateParam.Tile.TextureTexel);
                    effectUpdate.Parameters["TileTexel"].SetValue<Vector2>(updateParam.Tile.TileTexel);
                    effectUpdate.Parameters["SourceAvailable"].SetValue<bool>(updateParam.Tile.IsSynced);

                    effectUpdate.Parameters["SourceArea"].SetValue<Vector4>(updateParam.SourceArea.ToVector4());
                    effectUpdate.Parameters["CoarseArea"].SetValue<Vector4>(updateParam.CoarseArea.ToVector4());
                    effectUpdate.Parameters["TargetArea"].SetValue<Vector4>(updateParam.TargetArea.ToVector4());
                    quad.Draw(effectUpdate);
                }
            }
        }

        private void DrawClipmapGeometry()
        {
            for (int i = 0; i < clips.Count; i++)
            {
                var clip = clips[i];
                if (!clip.Active)
                {
                    continue;
                }
                effectRender.Parameters["Scale"].SetValue<float>(Scale);
                effectRender.Parameters["Density"].SetValue<float>(clip.Density);
                effectRender.Parameters["Clipsize"].SetValue<float>(clip.Clipsize);
                effectRender.Parameters["Center"].SetValue<Vector2>(clip.Center);

                effectRender.Parameters["ElevationTexel"].SetValue<Vector2>(clip.ElevationMap.GetTexel());
                effectRender.Parameters["ElevationTexture"].TrySetResource(clip.ElevationMap);
                effectRender.Parameters["ElevationSampler"].TrySetResource(GraphicsDevice.SamplerStates.PointWrap);

                effectRender.Parameters["NormalmapTexel"].SetValue<Vector2>(clip.NormalMap.GetTexel());
                effectRender.Parameters["NormalmapTexture"].TrySetResource(clip.NormalMap);
                effectRender.Parameters["NormalmapSampler"].TrySetResource(GraphicsDevice.SamplerStates.LinearWrap);

                foreach (var item in Enum.GetValues(typeof(GeometryFootprint)))
                {
                    var footprint = (GeometryFootprint)item;
                    if (degenerates)
                        footprint &= GeometryFootprint.OuterDegenerate;
                    if ((footprint & clip.Footprints) == footprint)
                    {
                        effectRender.Parameters["ShapeColor"].SetValue(DebugColor(footprint));
                        var g = geometries[footprint];
                        if (g != null)
                        {
                            g.Draw(effectRender);
                        }
                    }
                }
            }
        }

        private void DrawClipmapSprites(int index)
        {
            if (index >= 0)
            {
                GraphicsDevice.SetRasterizerState(GraphicsDevice.RasterizerStates.Default);
                int size = 128;

                if (index == 0)
                {
                    spriteBatch.Begin(SpriteSortMode.Deferred, GraphicsDevice.BlendStates.Opaque);
                    foreach (var clip in clips)
                    {
                        spriteBatch.Draw(clip.ElevationMap, new Rectangle(clip.Level * size, 0, size, size), Color.White);
                        if (clip.NormalMap != null)
                            spriteBatch.Draw(clip.NormalMap, new Rectangle(clip.Level * size, size, size, size), Color.White);
                    }
                    spriteBatch.End();
                }
                else if (index <= clips.Count)
                {
                    spriteBatch.Begin(SpriteSortMode.Deferred, GraphicsDevice.BlendStates.Opaque, GraphicsDevice.SamplerStates.PointClamp);
                    var clip = clips[index - 1];
                    size = 512;
                    spriteBatch.Draw(clip.ElevationMap, new Rectangle(0, 0, size, size), Color.White);
                    if (clip.NormalMap != null)
                        spriteBatch.Draw(clip.NormalMap, new Rectangle(size, 0, size, size), Color.White);
                    spriteBatch.End();
                }
            }
        }

        private Vector4 DebugColor(GeometryFootprint foorprint)
        {
            switch (foorprint)
            {
                case GeometryFootprint.MxM_01:
                case GeometryFootprint.MxM_03:
                case GeometryFootprint.MxM_06:
                case GeometryFootprint.MxM_07:
                case GeometryFootprint.MxM_10:
                case GeometryFootprint.MxM_12:
                    return new Vector4(1.0f, 0.5f, 0.5f, 1.0f);

                case GeometryFootprint.MxM_02:
                case GeometryFootprint.MxM_04:
                case GeometryFootprint.MxM_05:
                case GeometryFootprint.MxM_08:
                case GeometryFootprint.MxM_09:
                case GeometryFootprint.MxM_11:
                    return new Vector4(0.5f, 1.0f, 0.5f, 1.0f);

                case GeometryFootprint.RingFixup:
                    return new Vector4(1.0f, 1.0f, 0.5f, 1.0f);
                case GeometryFootprint.InteriorTop:
                case GeometryFootprint.InteriorRight:
                case GeometryFootprint.InteriorBottom:
                case GeometryFootprint.InteriorLeft:
                    return new Vector4(0.5f, 0.5f, 0.5f, 1.0f);
                case GeometryFootprint.Inner1:
                case GeometryFootprint.Inner4:
                    return new Vector4(1.0f, 0.5f, 0.5f, 1.0f);
                case GeometryFootprint.Inner2:
                case GeometryFootprint.Inner3:
                    return new Vector4(0.5f, 1.0f, 0.5f, 1.0f);
                case GeometryFootprint.Inner5:
                    return new Vector4(0.5f, 0.5f, 0.5f, 1.0f);
                default:
                    return Vector4.Zero;
            }
        }

        private void MakeScreenshot()
        {
            if (saveScreen)
            {
                var date = DateTime.Now;
                var name = "./screen-" + date.ToLongTimeString().Replace(":", "") + ".png";
                GraphicsDevice.BackBuffer.Save(name, ImageFileType.Png);
                saveScreen = false;
            }
            if (saveTargets)
            {
                foreach (var item in clips)
                {
                    if (item.ElevationMap != null)
                    {
                        item.ElevationMap.Save("./clip-" + item.Level + "-h.dds", ImageFileType.Dds);
                    }
                    if (item.NormalMap != null)
                    {
                        item.NormalMap.Save("./clip-" + item.Level + "-n.dds", ImageFileType.Dds);
                    }
                }
                saveTargets = false;
            }
        }
    }
}

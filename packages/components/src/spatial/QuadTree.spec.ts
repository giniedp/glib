import { BoundingBox, Intersection } from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import { QuadTree, QuadTreeNode } from './QuadTree'

const S = 1024 // horizontal size used across tests

describe('QuadTree', () => {
  describe('yUp — quad on XZ plane, Y is vertical', () => {
    let tree: QuadTree

    beforeEach(() => {
      tree = QuadTree.create({
        min: { x: 0, y: 0, z: 0 },
        max: { x: S, y: 100, z: S },
        verticalAxis: 'y',
      })
    })

    describe('root node', () => {
      it('is a root node', () => {
        expect(tree.isRoot).toBe(true)
        expect(tree.parent).toBeNull()
      })

      it('starts as a leaf', () => {
        expect(tree.isLeaf).toBe(true)
        expect(tree.children).toHaveLength(0)
      })

      it('has level 0', () => {
        expect(tree.level).toBe(0)
      })

      it('has correct size', () => {
        expect(tree.size).toBe(S)
      })

      it('has correct bounds', () => {
        expect(tree.bounds.min.x).toBe(0)
        expect(tree.bounds.min.y).toBe(0)
        expect(tree.bounds.min.z).toBe(0)
        expect(tree.bounds.max.x).toBe(S)
        expect(tree.bounds.max.y).toBe(100)
        expect(tree.bounds.max.z).toBe(S)
      })

      it('has correct center', () => {
        expect(tree.centerX).toBe(S / 2)
        expect(tree.centerY).toBe(50)
        expect(tree.centerZ).toBe(S / 2)
      })

      it('getRoot returns itself', () => {
        expect(tree.getRoot()).toBe(tree)
      })

      it('yUp is true', () => {
        expect(tree.yUp).toBe(true)
      })
    })

    describe('subdivide', () => {
      beforeEach(() => {
        tree.subdivide()
      })

      it('creates exactly 4 children', () => {
        expect(tree.children).toHaveLength(4)
      })

      it('is no longer a leaf', () => {
        expect(tree.isLeaf).toBe(false)
      })

      it('is idempotent — second call does not add more children', () => {
        tree.subdivide()
        expect(tree.children).toHaveLength(4)
      })

      it('children are leaf nodes', () => {
        for (const child of tree.children) {
          expect(child.isLeaf).toBe(true)
        }
      })

      it('children have level 1', () => {
        for (const child of tree.children) {
          expect(child.level).toBe(1)
        }
      })

      it('children have half the parent size', () => {
        for (const child of tree.children) {
          expect(child.size).toBe(S / 2)
        }
      })

      it('children reference the correct parent and root', () => {
        for (const child of tree.children) {
          expect(child.parent).toBe(tree)
          expect(child.root).toBe(tree)
        }
      })

      it('child 0 covers x:[0,half] z:[0,half]', () => {
        const c = tree.children[0]
        expect(c.bounds.min.x).toBe(0)
        expect(c.bounds.max.x).toBe(S / 2)
        expect(c.bounds.min.z).toBe(0)
        expect(c.bounds.max.z).toBe(S / 2)
      })

      it('child 1 covers x:[half,S] z:[0,half]', () => {
        const c = tree.children[1]
        expect(c.bounds.min.x).toBe(S / 2)
        expect(c.bounds.max.x).toBe(S)
        expect(c.bounds.min.z).toBe(0)
        expect(c.bounds.max.z).toBe(S / 2)
      })

      it('child 2 covers x:[0,half] z:[half,S]', () => {
        const c = tree.children[2]
        expect(c.bounds.min.x).toBe(0)
        expect(c.bounds.max.x).toBe(S / 2)
        expect(c.bounds.min.z).toBe(S / 2)
        expect(c.bounds.max.z).toBe(S)
      })

      it('child 3 covers x:[half,S] z:[half,S]', () => {
        const c = tree.children[3]
        expect(c.bounds.min.x).toBe(S / 2)
        expect(c.bounds.max.x).toBe(S)
        expect(c.bounds.min.z).toBe(S / 2)
        expect(c.bounds.max.z).toBe(S)
      })

      it('children preserve full Y extent', () => {
        for (const child of tree.children) {
          expect(child.bounds.min.y).toBe(0)
          expect(child.bounds.max.y).toBe(100)
        }
      })

      it('children tiles cover the full parent area without gaps', () => {
        const xs = new Set(tree.children.map((c) => c.bounds.min.x))
        const zs = new Set(tree.children.map((c) => c.bounds.min.z))
        expect(xs).toEqual(new Set([0, S / 2]))
        expect(zs).toEqual(new Set([0, S / 2]))
      })
    })

    describe('subdivideToLevel', () => {
      it('produces 1 root + 4 children at depth 1 (5 total)', () => {
        tree.subdivideToLevel(1)
        expect(tree.flatPreOrdered).toHaveLength(5)
      })

      it('produces 21 nodes at depth 2', () => {
        tree.subdivideToLevel(2)
        expect(tree.flatPreOrdered).toHaveLength(21) // 1 + 4 + 16
      })

      it('all leaf nodes are at the requested depth', () => {
        tree.subdivideToLevel(2)
        for (const node of tree.flatPreOrdered) {
          if (node.isLeaf) {
            expect(node.level).toBe(2)
          }
        }
      })

      it('does not sub-divide already-deep-enough nodes', () => {
        tree.subdivideToLevel(1)
        expect(tree.children[0].isLeaf).toBe(true)
      })
    })

    describe('subdivideToSize', () => {
      it('subdivides until all leaves are at or below target size', () => {
        tree.subdivideTosize(S / 4)
        for (const node of tree.flatPreOrdered) {
          if (node.isLeaf) {
            expect(node.size).toBeLessThanOrEqual(S / 4)
          }
        }
      })

      it('does not subdivide below the target size', () => {
        tree.subdivideTosize(S / 4)
        for (const node of tree.flatPreOrdered) {
          if (node.isLeaf) {
            expect(node.size).toBeGreaterThan(S / 8)
          }
        }
      })
    })

    describe('flatPreOrdered', () => {
      it('contains only root before subdivision', () => {
        expect(tree.flatPreOrdered).toHaveLength(1)
        expect(tree.flatPreOrdered[0]).toBe(tree)
      })

      it('root is first after subdivision', () => {
        tree.subdivide()
        expect(tree.flatPreOrdered[0]).toBe(tree)
      })

      it('contains all nodes after level-2 subdivision', () => {
        tree.subdivideToLevel(2)
        expect(tree.flatPreOrdered).toHaveLength(21)
      })
    })

    describe('flatPostOrdered', () => {
      it('contains only root before subdivision', () => {
        expect(tree.flatPostOrdered).toHaveLength(1)
      })

      it('root is last after subdivision', () => {
        tree.subdivide()
        const list = tree.flatPostOrdered
        expect(list[list.length - 1]).toBe(tree)
      })

      it('children appear before their parent', () => {
        tree.subdivide()
        const list = tree.flatPostOrdered
        const rootIdx = list.indexOf(tree)
        for (const child of tree.children) {
          expect(list.indexOf(child)).toBeLessThan(rootIdx)
        }
      })
    })

    describe('loose bounds', () => {
      it('extends by (size * looseFactor / 2) on each side', () => {
        const looseFactor = 2
        const t = QuadTree.create({
          min: { x: 0, y: 0, z: 0 },
          max: { x: S, y: 100, z: S },
          verticalAxis: 'y',
          looseFactor,
        })
        const ext = (S * looseFactor) / 2
        expect(t.looseBounds.min.x).toBe(t.bounds.min.x - ext)
        expect(t.looseBounds.max.x).toBe(t.bounds.max.x + ext)
        expect(t.looseBounds.min.z).toBe(t.bounds.min.z - ext)
        expect(t.looseBounds.max.z).toBe(t.bounds.max.z + ext)
      })

      it('with default looseFactor=1 expands by size/2 on each side', () => {
        const ext = S / 2
        expect(tree.looseBounds.min.x).toBe(-ext)
        expect(tree.looseBounds.max.x).toBe(S + ext)
        expect(tree.looseBounds.min.z).toBe(-ext)
        expect(tree.looseBounds.max.z).toBe(S + ext)
      })
    })

    describe('findFittingNode', () => {
      beforeEach(() => {
        tree.subdivideToLevel(2)
      })

      it('returns root for a volume spanning the full tree', () => {
        const volume = BoundingBox.create(0, 0, 0, S, 100, S)
        expect(tree.findFittingNode(volume)).toBe(tree)
      })

      it('returns a leaf for a small volume in a corner', () => {
        const volume = BoundingBox.create(S / 16, 0, S / 16, S / 8, 100, S / 8)
        const node = tree.findFittingNode(volume)
        expect(node.isLeaf).toBe(true)
        expect(node.level).toBe(2)
      })
    })

    describe('traverseIntersection', () => {
      let visited: QuadTreeNode[]

      beforeEach(() => {
        tree.subdivideToLevel(1)
        visited = []
      })

      it('visits all 5 nodes when box covers the full tree', () => {
        const vol = BoundingBox.create(0, 0, 0, S, 100, S)
        tree.traverseIntersection(vol, Intersection.boxBox, (n) => visited.push(n))
        expect(visited).toHaveLength(5)
      })

      it('visits root and the single matching child for a corner box', () => {
        const vol = BoundingBox.create(0, 0, 0, S / 2, 100, S / 2)
        tree.traverseIntersection(vol, Intersection.boxBox, (n) => visited.push(n))
        expect(visited).toContain(tree)
        expect(visited).toContain(tree.children[0]) // lower-left (x:[0,S/2] z:[0,S/2])
      })

      it('does not visit the diagonally opposite child', () => {
        // Volume must be small enough to be disjoint from child 3's loose bounds.
        // Child 3 (x:[S/2,S], z:[S/2,S]) has loose extension = S/4 at level 1, so
        // its looseBounds start at x = S/2 - S/4 = S/4. Use max = S/8 to stay clear.
        const vol = BoundingBox.create(0, 0, 0, S / 8, 100, S / 8)
        tree.traverseIntersection(vol, Intersection.boxBox, (n) => visited.push(n))
        expect(visited).not.toContain(tree.children[3]) // upper-right is disjoint
      })
    })

    describe('traverseLOD', () => {
      beforeEach(() => {
        tree.subdivideToLevel(2)
      })

      it('selects only root when camera is very far away', () => {
        const visited: QuadTreeNode[] = []
        tree.traverseLOD({ x: S * 100, y: 50, z: S * 100 }, 1, (n) => visited.push(n))
        expect(visited).toHaveLength(1)
        expect(visited[0]).toBe(tree)
      })

      it('selects all 16 leaf nodes when camera is at center', () => {
        const visited: QuadTreeNode[] = []
        tree.traverseLOD({ x: S / 2, y: 50, z: S / 2 }, 1, (n) => visited.push(n))
        expect(visited).toHaveLength(16)
        for (const node of visited) {
          expect(node.isLeaf).toBe(true)
        }
      })
    })

    describe('grid coordinates', () => {
      beforeEach(() => {
        tree.subdivideToLevel(1)
      })

      it('root has zero root-grid coordinates', () => {
        expect(tree.rootGridX).toBe(0)
        expect(tree.rootGridZ).toBe(0)
      })

      it('children have correct XZ root-grid positions', () => {
        const [c0, c1, c2, c3] = tree.children
        expect(c0.rootGridX).toBe(0)
        expect(c0.rootGridZ).toBe(0)
        expect(c1.rootGridX).toBe(1)
        expect(c1.rootGridZ).toBe(0)
        expect(c2.rootGridX).toBe(0)
        expect(c2.rootGridZ).toBe(1)
        expect(c3.rootGridX).toBe(1)
        expect(c3.rootGridZ).toBe(1)
      })

      it('children have correct parent-grid positions', () => {
        const [c0, c1, c2, c3] = tree.children
        expect(c0.parentGridX).toBe(0)
        expect(c0.parentGridZ).toBe(0)
        expect(c1.parentGridX).toBe(1)
        expect(c1.parentGridZ).toBe(0)
        expect(c2.parentGridX).toBe(0)
        expect(c2.parentGridZ).toBe(1)
        expect(c3.parentGridX).toBe(1)
        expect(c3.parentGridZ).toBe(1)
      })
    })
  })

  // ---------------------------------------------------------------------------

  describe('zUp — quad on XY plane, Z is vertical', () => {
    let tree: QuadTree

    beforeEach(() => {
      tree = QuadTree.create({
        min: { x: 0, y: 0, z: 0 },
        max: { x: S, y: S, z: 100 }, // sizeX == sizeY; Z is height extent
        verticalAxis: 'z',
      })
    })

    describe('root node', () => {
      it('is a root node', () => {
        expect(tree.isRoot).toBe(true)
        expect(tree.parent).toBeNull()
      })

      it('starts as a leaf', () => {
        expect(tree.isLeaf).toBe(true)
        expect(tree.children).toHaveLength(0)
      })

      it('has level 0', () => {
        expect(tree.level).toBe(0)
      })

      it('has correct size (sizeX)', () => {
        expect(tree.size).toBe(S)
      })

      it('has correct bounds', () => {
        expect(tree.bounds.min.x).toBe(0)
        expect(tree.bounds.min.y).toBe(0)
        expect(tree.bounds.min.z).toBe(0)
        expect(tree.bounds.max.x).toBe(S)
        expect(tree.bounds.max.y).toBe(S)
        expect(tree.bounds.max.z).toBe(100)
      })

      it('yUp is false', () => {
        expect(tree.yUp).toBe(false)
      })

      it('getRoot returns itself', () => {
        expect(tree.getRoot()).toBe(tree)
      })
    })

    describe('subdivide', () => {
      beforeEach(() => {
        tree.subdivide()
      })

      it('creates exactly 4 children', () => {
        expect(tree.children).toHaveLength(4)
      })

      it('is no longer a leaf', () => {
        expect(tree.isLeaf).toBe(false)
      })

      it('is idempotent', () => {
        tree.subdivide()
        expect(tree.children).toHaveLength(4)
      })

      it('children are leaf nodes', () => {
        for (const child of tree.children) {
          expect(child.isLeaf).toBe(true)
        }
      })

      it('children have level 1', () => {
        for (const child of tree.children) {
          expect(child.level).toBe(1)
        }
      })

      it('children have half the parent size', () => {
        for (const child of tree.children) {
          expect(child.size).toBe(S / 2)
        }
      })

      it('children reference the correct parent and root', () => {
        for (const child of tree.children) {
          expect(child.parent).toBe(tree)
          expect(child.root).toBe(tree)
        }
      })

      it('child 0 covers x:[0,half] y:[0,half]', () => {
        const c = tree.children[0]
        expect(c.bounds.min.x).toBe(0)
        expect(c.bounds.max.x).toBe(S / 2)
        expect(c.bounds.min.y).toBe(0)
        expect(c.bounds.max.y).toBe(S / 2)
      })

      it('child 1 covers x:[half,S] y:[0,half]', () => {
        const c = tree.children[1]
        expect(c.bounds.min.x).toBe(S / 2)
        expect(c.bounds.max.x).toBe(S)
        expect(c.bounds.min.y).toBe(0)
        expect(c.bounds.max.y).toBe(S / 2)
      })

      it('child 2 covers x:[0,half] y:[half,S]', () => {
        const c = tree.children[2]
        expect(c.bounds.min.x).toBe(0)
        expect(c.bounds.max.x).toBe(S / 2)
        expect(c.bounds.min.y).toBe(S / 2)
        expect(c.bounds.max.y).toBe(S)
      })

      it('child 3 covers x:[half,S] y:[half,S]', () => {
        const c = tree.children[3]
        expect(c.bounds.min.x).toBe(S / 2)
        expect(c.bounds.max.x).toBe(S)
        expect(c.bounds.min.y).toBe(S / 2)
        expect(c.bounds.max.y).toBe(S)
      })

      it('children preserve full Z extent', () => {
        for (const child of tree.children) {
          expect(child.bounds.min.z).toBe(0)
          expect(child.bounds.max.z).toBe(100)
        }
      })

      it('children tiles cover the full parent XY area without gaps', () => {
        const xs = new Set(tree.children.map((c) => c.bounds.min.x))
        const ys = new Set(tree.children.map((c) => c.bounds.min.y))
        expect(xs).toEqual(new Set([0, S / 2]))
        expect(ys).toEqual(new Set([0, S / 2]))
      })
    })

    describe('subdivideToLevel', () => {
      it('produces 5 nodes at depth 1', () => {
        tree.subdivideToLevel(1)
        expect(tree.flatPreOrdered).toHaveLength(5)
      })

      it('produces 21 nodes at depth 2', () => {
        tree.subdivideToLevel(2)
        expect(tree.flatPreOrdered).toHaveLength(21)
      })

      it('all leaves are at requested depth', () => {
        tree.subdivideToLevel(2)
        for (const node of tree.flatPreOrdered) {
          if (node.isLeaf) {
            expect(node.level).toBe(2)
          }
        }
      })
    })

    describe('traverseLOD', () => {
      beforeEach(() => {
        tree.subdivideToLevel(2)
      })

      it('selects only root when camera is very far away', () => {
        const visited: QuadTreeNode[] = []
        // zUp uses XY distance; Z is height so camera.z does not affect horizontal distance
        tree.traverseLOD({ x: S * 100, y: S * 100, z: 50 }, 1, (n) => visited.push(n))
        expect(visited).toHaveLength(1)
        expect(visited[0]).toBe(tree)
      })

      it('selects all 16 leaf nodes when camera is at XY center', () => {
        const visited: QuadTreeNode[] = []
        tree.traverseLOD({ x: S / 2, y: S / 2, z: 50 }, 1, (n) => visited.push(n))
        expect(visited).toHaveLength(16)
        for (const node of visited) {
          expect(node.isLeaf).toBe(true)
        }
      })
    })

    describe('grid coordinates', () => {
      beforeEach(() => {
        tree.subdivideToLevel(1)
      })

      it('children have correct XY root-grid positions', () => {
        const [c0, c1, c2, c3] = tree.children
        expect(c0.rootGridX).toBe(0)
        expect(c0.rootGridY).toBe(0)
        expect(c1.rootGridX).toBe(1)
        expect(c1.rootGridY).toBe(0)
        expect(c2.rootGridX).toBe(0)
        expect(c2.rootGridY).toBe(1)
        expect(c3.rootGridX).toBe(1)
        expect(c3.rootGridY).toBe(1)
      })

      it('children have correct parent-grid positions', () => {
        const [c0, c1, c2, c3] = tree.children
        expect(c0.parentGridX).toBe(0)
        expect(c0.parentGridY).toBe(0)
        expect(c1.parentGridX).toBe(1)
        expect(c1.parentGridY).toBe(0)
        expect(c2.parentGridX).toBe(0)
        expect(c2.parentGridY).toBe(1)
        expect(c3.parentGridX).toBe(1)
        expect(c3.parentGridY).toBe(1)
      })
    })
  })

  // ---------------------------------------------------------------------------

  describe('invalid creation', () => {
    it('throws for non-square XZ bounds on yUp tree', () => {
      expect(() =>
        QuadTree.create({
          min: { x: 0, y: 0, z: 0 },
          max: { x: 1024, y: 100, z: 512 },
          verticalAxis: 'y',
        }),
      ).toThrow()
    })

    it('throws for non-square XY bounds on zUp tree', () => {
      expect(() =>
        QuadTree.create({
          min: { x: 0, y: 0, z: 0 },
          max: { x: 1024, y: 512, z: 100 },
          verticalAxis: 'z',
        }),
      ).toThrow()
    })
  })
})

import { MTL } from './MTL'

describe('glib/content/parser/MTL', () => {
  describe('#parse', () => {

    it('reads newmtl', () => {
      expect(MTL.parse('newmtl the name')[0].name).toBe('the name')
    })

    it('reads Ka', () => {
      expect(MTL.parse(`
# some comment
newmtl name
Ka 1 2 3
      `)[0].Ka).toEqual([1, 2, 3])
    })
    it('reads Ka', () => {
      expect(MTL.parse('newmtl name\nKa 1 2')[0].Ka).toEqual([1, 2, 1])
    })
    it('reads Ka', () => {
      expect(MTL.parse('newmtl name\nKa 1')[0].Ka).toEqual([1, 1, 1])
    })

    it('reads Kd', () => {
      expect(MTL.parse('newmtl name\nKd 1 2 3')[0].Kd).toEqual([1, 2, 3])
    })
    it('reads Kd', () => {
      expect(MTL.parse('newmtl name\nKd 1 2')[0].Kd).toEqual([1, 2, 1])
    })
    it('reads Kd', () => {
      expect(MTL.parse('newmtl name\nKd 1')[0].Kd).toEqual([1, 1, 1])
    })

    it('reads Ks', () => {
      expect(MTL.parse('newmtl name\nKs 1 2 3')[0].Ks).toEqual([1, 2, 3])
    })
    it('reads Ks', () => {
      expect(MTL.parse('newmtl name\nKs 1 2')[0].Ks).toEqual([1, 2, 1])
    })
    it('reads Ks', () => {
      expect(MTL.parse('newmtl name\nKs 1')[0].Ks).toEqual([1, 1, 1])
    })

    it('reads Tf', () => {
      expect(MTL.parse('newmtl name\nTf 1 2 3')[0].Tf).toEqual([1, 2, 3])
    })
    it('reads Tf', () => {
      expect(MTL.parse('newmtl name\nTf 1 2')[0].Tf).toEqual([1, 2, 1])
    })
    it('reads Tf', () => {
      expect(MTL.parse('newmtl name\nTf 1')[0].Tf).toEqual([1, 1, 1])
    })

    it('reads illum', () => {
      expect(MTL.parse('newmtl name\nillum 10')[0].illum).toEqual('10')
    })

    it('reads d', () => {
      expect(MTL.parse('newmtl name\nd 10')[0].d).toEqual(10)
    })
    it('reads Tr', () => {
      expect(MTL.parse('newmtl name\nTr 10')[0].d).toEqual(10)
    })

    it('reads Ns', () => {
      expect(MTL.parse('newmtl name\nNs 10')[0].Ns).toEqual(10)
    })

    it('reads sharpness', () => {
      expect(MTL.parse('newmtl name\nsharpness 10')[0].sharpness).toEqual(10)
    })

    it('reads Ni', () => {
      expect(MTL.parse('newmtl name\nNi 10')[0].Ni).toEqual(10)
    })

    it('reads map_Ka', () => {
      expect(MTL.parse('newmtl name\nmap_Ka file.png')[0].map_Ka.file).toEqual('file.png')
    })

  })
})

import {expect} from 'chai'
import {ethers} from 'ethers'

import {
  buildFragmentFromCastSignature,
  castStyleCall,
  parseCastSignature,
} from '../../src/lib/cast-call.js'

describe('cast-call', () => {
  describe('parseCastSignature', () => {
    it('parses balanceOf(address)(uint256)', () => {
      const r = parseCastSignature('balanceOf(address)(uint256)')
      expect(r).to.deep.equal({inputs: 'address', name: 'balanceOf', outputs: 'uint256'})
    })

    it('parses totalSupply()(uint256)', () => {
      const r = parseCastSignature('totalSupply()(uint256)')
      expect(r).to.deep.equal({inputs: '', name: 'totalSupply', outputs: 'uint256'})
    })

    it('parses getPair(address,address)(address,(uint256,uint256))', () => {
      const r = parseCastSignature('getPair(address,address)(address,(uint256,uint256))')
      expect(r?.name).to.equal('getPair')
      expect(r?.inputs).to.equal('address,address')
      expect(r?.outputs).to.equal('address,(uint256,uint256)')
    })

    it('returns null for plain method name', () => {
      expect(parseCastSignature('balanceOf')).to.be.null
      expect(parseCastSignature('totalSupply')).to.be.null
    })
  })

  describe('buildFragmentFromCastSignature', () => {
    it('builds fragment and encodes balanceOf', () => {
      const frag = buildFragmentFromCastSignature('balanceOf(address)(uint256)')
      expect(frag.name).to.equal('balanceOf')
      const iface = new ethers.Interface([frag])
      const data = iface.encodeFunctionData(frag, ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'])
      expect(data).to.match(/^0x70a08231/)
    })
  })

  describe('castStyleCall', () => {
    it('encodes and decodes against mock provider', async () => {
      const mockResult =
        '0x0000000000000000000000000000000000000000000000000000000000000064'
      const provider = {
        call: async () => mockResult,
      } as unknown as ethers.Provider
      const result = await castStyleCall(
        provider,
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'balanceOf(address)(uint256)',
        ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045']
      )
      expect(result.length).to.equal(1)
      expect(result[0]).to.equal(100n)
    })
  })
})

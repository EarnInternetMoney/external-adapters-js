const { Requester, Validator } = require('@chainlink/external-adapter')
const adapterCreateRequest = require('./priceAdapter').createRequest
const adapterCalculateIndex = require('./priceAdapter').calculateIndex
const snx = require('synthetix')

const DEFAULT_NETWORK = 'mainnet'

const customParams = {
  asset: ['asset', 'from'],
  network: false
}

const createRequest = (input, callback) => {
  synthIndexRequest(input, adapterCreateRequest, callback)
}

const synthIndexRequest = (input, adapter, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const asset = validator.validated.data.asset.toLowerCase()
  const network = validator.validated.data.network || DEFAULT_NETWORK

  const synths = snx.getSynths({ network: network.toLowerCase() }).filter(({ index, inverted }) => index && !inverted)
  const synth = synths.find(d => d.name.toLowerCase() === asset)

  adapter(jobRunID, synth).then((data) => {
    data.result = adapterCalculateIndex(data.index)
    const response = {
      status: 200,
      data
    }
    callback(response.status, Requester.success(jobRunID, response))
  }).catch((error) => {
    callback(500, Requester.errored(jobRunID, error))
  })
}

exports.createRequest = createRequest

const NETWORK_JOIN_TIMEOUT_INTERVAL = 60 * 1000
const NETWORK_POLL_INTERVAL = 600
const NETWORK_WAIT_TIMEOUT_INTERVAL = 120 * 1000

const neofetch = async (path, body, onError = null) => {
  try {
    const response = await fetch(new URL(path, 'http://localhost:9753').toString(), {
      method: 'POST',
      headers: [['Content-Type', 'application/json']],
      body: JSON.stringify(body)
    })
    return await response.json()
  } catch (error) {
    if (onError) {
      onError()
    }
  }
}


const waitUntil = async (condition, interval = 10) => {
  const poll = (resolve) => {
    if (condition()) {
      resolve(undefined)
    } else setTimeout(() => poll(resolve), interval)
  }

  return new Promise(poll)
}

export { NETWORK_JOIN_TIMEOUT_INTERVAL, NETWORK_POLL_INTERVAL, NETWORK_WAIT_TIMEOUT_INTERVAL, neofetch, waitUntil }

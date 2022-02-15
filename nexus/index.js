const axios = require('axios').default;
const cookie = require('cookie');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * API of Nexus Repository Manager
 */
class Nexus {
    server;

    /**
     * get header
     * @returns {{Accept: string, Referer, "X-nexus-ui": string}}
     */
    getHeader() {
        return {
            Accept: 'application/json,application/vnd.siesta-error-v1+json,application/vnd.siesta-validation-errors-v1+json',
            Referer: this.server,
            'X-nexus-ui': 'true'
        }
    }

    /**
     * login to nexus repository manager
     * @param username username
     * @param password password
     * @returns {Promise<void>}
     */
    async login(username, password) {
        const url = `https://${(this.server)}/service/local/authentication/login`
        const header = {
            ...this.getHeader(),
            Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        }
        const result = await axios.get(url, {headers: {...header}})
        this.cookie = `NXSESSIONID=${cookie.parse(result.headers['set-cookie'][0]).NXSESSIONID}`
    }

    /**
     * get staging repositories
     * @returns {Promise<*>}
     */
    async getStagingRepositories() {
        const url = `https://${(this.server)}/service/local/staging/profile_repositories`
        const header = {
            ...this.getHeader(),
            Cookie: this.cookie
        }
        const result = await axios.get(url, {headers: {...header}})
        return result.data.data
    }

    /**
     * Close and wait
     * @param repositoryId repository id
     * @returns {Promise<void>}
     */
    async closeAndWait(repositoryId) {
        //post close request
        const url = `https://${(this.server)}/service/local/staging/bulk/close`
        const data = {
            data: {
                description: '',
                stagedRepositoryIds: [repositoryId]
            }
        }
        const header = {
            ...this.getHeader(),
            'Content-Type': 'application/json',
            Cookie: this.cookie
        }
        await axios.post(url, {data: {...data}}, {headers: {...header}})
        //wait
        while (true) {
            await sleep(20000)
            const url = `https://${(this.server)}/service/local/staging/repository/${repositoryId}/activity`
            const header = {
                ...this.getHeader(),
                Cookie: this.cookie
            }
            const result = await axios.get(url, {headers: {...header}})
            const closeEvents = result.data.filter((e) => e.name === 'close')[0].events
            const failEvents = closeEvents.filter((e) => e.name === 'ruleFailed')
            if (failEvents.length >= 1) {
                throw new Error('Nexus close failed:', JSON.stringify(failEvents))
            }
            if (closeEvents[closeEvents.length - 1].name === 'repositoryClosed') {
                break
            }
        }
    }

    /**
     * Release staging repository and drop it
     * @param repositoryId repository id
     * @returns {Promise<void>}
     */
    async releaseAndDrop(repositoryId) {
        const url = `https://${(this.server)}/service/local/staging/bulk/promote`
        const data = {
            autoDropAfterRelease: true,
            description: '',
            stagedRepositoryIds: [repositoryId]
        }
        const header = {
            ...this.getHeader(),
            'Content-Type': 'application/json',
            Cookie: this.cookie
        }
        await axios.post(url, {data: {...data}}, {headers: {...header}})
    }

}

module.exports = new Nexus()
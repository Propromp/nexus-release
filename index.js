const core = require("@actions/core");
const nexus = require("./nexus/index");

(
    async function () {
        const groupId = core.getInput("groupId")
        nexus.server = core.getInput("server")
        await nexus.login(core.getInput("nexusUsername"),core.getInput("nexusPassword"))
        console.log("Finding repository")
        const repositories = await nexus.getStagingRepositories()
        const targetRepos = repositories.filter((r) => r.profileName = groupId)
        if (!targetRepos || targetRepos.length <= 0) {
            throw new Error(`Repository not found,repositories:${JSON.stringify(repositories)}`);
        }
        if (targetRepos.length > 1) {
            throw new Error(`Repository is duplicated:${JSON.stringify(repositories)}`);
        }
        console.log("Repository found.")
        const repo = targetRepos[0];
        console.log('Nexus closing');
        await nexus.closeAndWait(repo.repositoryId);
        console.log('Nexus closed');
        await nexus.releaseAndDrop(repo.repositoryId);
        console.log('Nexus released');
    }
)();
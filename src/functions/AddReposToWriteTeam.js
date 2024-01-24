// Hook for GitHub Organization creation

const { app } = require('@azure/functions')
const { Octokit } = require("@octokit/core")
const { paginateRest } = require('@octokit/plugin-paginate-rest')

app.http('AddReposToWriteTeam', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`)

        const PaginateOctokit = Octokit.plugin(paginateRest);
        const octokit = new PaginateOctokit({
            auth: `${process.env["GITHUB_TOKEN"]}`,
            baseUrl: `${process.env["GITHUB_URL"]}`
        })
        
        try {
            const org = 'Tools'

            const repos = await octokit.paginate (
                `GET /orgs/${org}/repos/`, {
                    per_page: 100,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                },
                response => response.data.map(repo => repo)
            )

            repos.forEach(async (repo) => {
                try {
                    await octokit.request(`PUT /orgs/${repo.owner.login}/teams/${repo.owner.login}-write/repos/${repo.owner.login}/${repo.name}`, {
                        permission: 'push',
                        headers: {
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    })
                } catch (error) {
                    context.error(`Error! Status: ${error.status}. Message: ${error.response.data.message}`)
                }
            })

            return { body: 200 }
        } catch (error) {
            context.log(`Error! Status: ${error.status}. Message: ${error.response.data.message}`)
            throw error
        }
    }
});

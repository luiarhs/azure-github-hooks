// Hook for GitHub Organization creation

const { app } = require('@azure/functions')
const { Octokit } = require("@octokit/core")
const { paginateRest } = require('@octokit/plugin-paginate-rest')

app.http('OnGithubOrgCreate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        
        context.log(`Http function processed request for url "${request.url}"`)

        const org = request.body.organization.login;
        const PaginateOctokit = Octokit.plugin(paginateRest);
        const octokit = new PaginateOctokit({
            auth: `${process.env["GITHUB_TOKEN"]}`,
            baseUrl: `${process.env["GITHUB_URL"]}`
        });

        try {
            // GET https://docs.github.com/en/enterprise-server@3.10/rest/users/users?apiVersion=2022-11-28#list-users
            const users = await octokit.paginate(
                'GET /users', {
                    per_page: 100,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                },
                response => response.data.map(user => user)
            )

            users.forEach(async (user) => {
                try {
                    // PUT https://docs.github.com/en/enterprise-server@3.10/rest/orgs/members#set-organization-membership-for-a-user
                    await octokit.request(`PUT /orgs/${org}/memberships/${user.login}`, {
                        role: 'member',
                        headers: {
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    });
                    context.info(`Adding '${user.login}' to '${org}' as a member.`);
                }
                catch (error) {
                    context.error(`Error! Status: ${error.status}. User: ${user.login}. Message: ${error.response.data.message}`);
                }
            });

            return { body: 200 }
        } catch (error) {
            context.log(`Error! Status: ${error.status}. Message: ${error.response.data.message}`)
            throw error
        }
    }
});

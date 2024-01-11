const { app } = require('@azure/functions');
const { Octokit } = require("@octokit/core");
let { graphql } = require("@octokit/graphql");



app.http('AddReposToWriteTeams', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`)

        graphql = graphql.defaults({
            baseUrl: "https:/github.leneldev.com/api",
            headers: {
                authorization: `${process.env["GITHUB_TOKEN"]}`,
            },
        });
        
        try {
            const { response } = await graphql(`
                {
                    enterprise(name 'leneldev') {
                        organizations() {
                            node {
                                login
                            }
                        }
                    }
                }
            `);
            // const response = await octokit.graphql(
            //     `query ($login: String!) {
            //         organization(login: $login) {
            //             repositories(privacy: PRIVATE) {
            //                 totalCount
            //             }
            //         }
            //     }`,
            //     { login: "octokit" },
            // );

            context.log(response);
        } catch (error) {
            context.log(`Error! Status: ${error.status}. Message: ${error.response.data.message}`)
        }

        // const name = request.query.get('name') || await request.text() || 'world';

        return { body: response };
    }
});

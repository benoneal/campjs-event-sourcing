/* 
  Free download - transactional email
  Free download - purchase conversion campaign

  Express server entry point
  Handles downloading free version of a game
*/

// Server entry point
postEndpoint('/api/free/', ({
  email, 
  game_slug, 
  experiments, 
  cookies: {id_token}
}) => 
  handleFreeDownload({email, game_slug, experiments, id_token}),
  validate(validations.free)
)


const handleFreeDownload = (payload) => 
  setupPermissions(payload)
    .then(() => enrolInFreeEmailCampaign(payload))


const setupPermissions = promisePipe(
  subscribe, 
  grantFileAccess, 
  trackFreeDownload
)


// Transactional email 'free_download'
// Mini email campaign: 
// - 'vote_request' @ day 3|7
// - 'purchase_request' @ day 5|11
const enrolInFreeEmailCampaign = createEmailCampaign('free_download', {
  vote_request: ({experiments: {earlyFollowup}}) => 
    days(earlyFollowup ? 3 : 7),
  purchase_request: ({experiments: {earlyFollowup}}) => 
    days(earlyFollowup ? 5 : 11)
})

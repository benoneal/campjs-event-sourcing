/* 
  Email queueing

  At this point we have some EMAIL_REQUESTED events in our ES
  We need to react to these events, to process and send the emails
*/

import {storeAndProject, storeDeferred} from '../db'


// Create an email campaign, kicked off with an initial email
export const createEmailCampaign = (template, deferredConfig) => (payload) => 
  Promise.all([
    sendEmail({template, ...payload}), 
    ...mapDeferred(deferredConfig, payload)
  ]).then(([initialSend]) => initialSend)


const mapDeferred = (deferred, payload) => 
  keys(deferred).map((template) => 
    deferEmail({template, ...payload}, deferred[template](payload)))


// Send a single email in the future, maybe repeat it
export const deferEmail = (payload, delay, repeat) =>
  storeDeferred(requestEmail({...payload, id: uuid()}), delay, repeat)

  
// Send a single email now
export const sendEmail = (payload) => {
  const id = uuid()
  const resolveWhen = (emails) => emails[id].sent || emails[id].failed
  const whenEmailDone = storeAndProject(EMAILS, resolveWhen)

  return whenEmailDone(requestEmail({...payload, id}))
    .then((emails) => 
      ({emailStatus: emails[id].failed ? 'failed' : 'success'}))
}

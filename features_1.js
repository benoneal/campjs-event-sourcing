/*
  Create an experiment for A/B testing

  Seed db with experiment name and rollout
*/

seed(editExperiment({
  experiment: 'earlyFollowup',
  rollout: 50
}))

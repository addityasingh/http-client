workflow "build and test" {
  on = "push"
  resolves = ["build", "test"]
}

action "install" {
  uses = "actions/npm@master"
  args = "install"
}

action "build" {
  needs = "install"
  uses = "actions/npm@master"
  args = "run build"
}

action "test" {
  needs = "install"
  uses = "actions/npm@master"
  args = "run test"
}

# workflow "publish on release" {
#   on = "release"
#   resolves = ["publish"]
# }

# action "publish" {
#   needs = "build"
#   uses = "actions/npm@master"
#   args = "publish"
#   secrets = ["NPM_AUTH_TOKEN"]
# }

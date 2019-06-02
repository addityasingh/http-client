workflow "build and test" {
  on = "push"
  resolves = ["build", "test", "lint", "check-format"]
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

action "lint" {
  needs = "install"
  uses = "actions/npm@master"
  args = "run lint"
}

action "check-format" {
  needs = "install"
  uses = "actions/npm@master"
  args = "run check-format"
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

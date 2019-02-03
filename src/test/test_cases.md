# test cases

## 1. Empty Folder

1. Open vscode with no folders open
1. Open the command palette
1. execute `ddev start`

Expected: Error message `[ddev] you need to open a project first`

## 2. ddev start

1. Open vscode with a valid ddev project
1. open the command palette
1. execute `ddev: Start`

Expected: Info `[ddev] starting` \
Expected: Browser is opening

## 3. ddev composer install (success)

1. Open vscode with a valid ddev project
1. open the command palette
1. execute `ddev: Composer install`

Expected: Info `[ddev] composer is installing dependencies` \
Expected: Info `[ddev] composer is installing package abc` \
Expected: Info `[ddev] composer has installed successfully`

## 3. ddev composer install (failing)

1. Open vscode with a valid ddev project but an invalid composer.json
1. open the command palette
1. execute `ddev: Composer install`

Expected: Error `[ddev] composer failed due to ...`

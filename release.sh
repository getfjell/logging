#!/bin/bash
set -e

# It is very important to set the GITHUB_TOKEN environment variable for this script to work.
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set."
  exit 1
fi

echo "Running commit script..."
./commit.sh

echo "Running clean, lint, build, and test..."
pnpm run clean && pnpm run lint && pnpm run build && pnpm run test

echo "Bumping version..."
pnpm version patch

echo "Generating release notes..."
pnpm dlx @eldrforge/kodrdriv release > RELEASE_NOTES.md

echo "Pushing to origin..."
git push --follow-tags

echo "Creating GitHub pull request..."
PR_URL=$(gh pr create --fill)
PR_NUM=$(echo "$PR_URL" | grep -o '[0-9]*$')
echo "Pull request created: $PR_URL"

echo "Waiting for PR #$PR_NUM checks to complete..."
while true; do
  STATUS=$(gh pr view "$PR_NUM" --json statusCheckRollup -q '.statusCheckRollup.state' || echo "FAILURE")
  if [[ "$STATUS" == "SUCCESS" ]]; then
    echo "All checks passed!"
    break
  elif [[ "$STATUS" == "FAILURE" || "$STATUS" == "ERROR" ]]; then
    echo "PR checks failed."
    gh pr checks "$PR_NUM"
    exit 1
  elif [[ "$STATUS" == "PENDING" ]]; then
    echo "Checks are pending... waiting 30 seconds."
    sleep 30
  else
    echo "Unknown PR status: $STATUS. Waiting 30 seconds."
    sleep 30
  fi
done

echo "Merging PR #$PR_NUM..."
gh pr merge "$PR_NUM" --merge --delete-branch

echo "Checking out main branch..."
git checkout main
git pull origin main

echo "Creating GitHub release..."
TAG_NAME="v$(jq -r .version package.json)"
gh release create "$TAG_NAME" --notes-file RELEASE_NOTES.md

echo "Creating next release branch..."
CURRENT_VERSION=$(jq -r .version package.json)
IFS='.' read -r -a version_parts <<< "$CURRENT_VERSION"
NEXT_PATCH=$((version_parts[2] + 1))
NEXT_VERSION="${version_parts[0]}.${version_parts[1]}.$NEXT_PATCH"

echo "Next version is $NEXT_VERSION"
git checkout -b "release/v$NEXT_VERSION"
pnpm version "$NEXT_VERSION" --no-git-tag-version --allow-same-version
git add package.json pnpm-lock.yaml
git commit -m "feat: Start release v$NEXT_VERSION"
git push -u origin "release/v$NEXT_VERSION"

echo "Release process completed." 
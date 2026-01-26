#!/bin/bash


if [[ -n $(git status --porcelain ./tests) ]]; then
    echo "🤖 AI Agent detected fixes. Preparing Pull Request..."
    
    BRANCH_NAME="ai-fix/update-tests-$(date +%Y%m%d%H%M)"
    git checkout -b $BRANCH_NAME
    git add ./tests
    git commit -m "chore(qa): self-healing update by AI Agent"
    
    git push origin $BRANCH_NAME
    gh pr create --title "🤖 AI Self-Healing: Test Suite Update" --body "The AI Agent detected UI changes and automatically updated the test selectors to maintain CI stability."
else
    echo "✅ No UI changes detected. Tests are stable."
fi
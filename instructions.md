git clone your-repo-url

git fetch
git checkout -b new-branch-name origin/base-branch-name


Make your changes

IMPORTANT: anytime just before pushing
git fetch
git merge origin/base-branch-name

git add .
git commit -m "your message"
git push -u origin new-branch-name

Again make some changes this time you won't need -u flag

git add .
git commit -m "your message"
git push
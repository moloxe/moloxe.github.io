echo "Deploying to gh-pages"

echo "Preparing gh-pages branch"
rm -rf scripts/temp-deploy
mkdir scripts/temp-deploy
cd scripts/temp-deploy

echo "Cloning gh-pages branch"
git clone --branch gh-pages https://github.com/moloxe/moloxe.github.io.git .

echo "Copying files to gh-pages branch"
rm -rf *
cp -r ../../dist/* .

echo "Adding new files to gh-pages branch"
git add .
git commit -m "Deploying to gh-pages"
git push origin gh-pages

echo "Cleaning up"
cd ../../
rm -rf scripts/temp-deploy

echo "Deployment complete"

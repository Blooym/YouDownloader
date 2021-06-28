# Releasing New Versions

## Making a new tag for version
**0.0.0 = Tag for the Version**

Making a release from the latest commit:
```
git tag 0.0.0 HEAD
```
Pushing the tag to the repository
```
git push origin 0.0.0
```

## CI 
GitHub Actions will automatically generate a changelog and create a release for the tag you uploaded, be sure to update package.json and package-lock.json's version and commiting it before you push your tag, otherwise CI will encounter problems. If CI fails to make the application when a tag is made, it will skip uploading a release and the tag will have to be remade.

## CI - Prerelease
GitHub Actions will automatically generate a prerelease for any commit pushed to the repository unless you specify not to with `[skip ci]` and attach a completed build with it. If CI fails to build the project, it will skip pre-release.

## Application Autoupdating
YouDownloader uses update-electron-app to issue autoupdates when releases are made.

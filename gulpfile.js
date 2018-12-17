"use strict"
const gulp = require("gulp")
const fs = require("fs-extra")
const merge = require("gulp-merge-json")

const ASSET_FILES = [
  "src/*.json",
  "src/**/*.json",
  "src/**/*.jade",
  "src/**/*.css",
  "src/**/*.png"
]

gulp.task("build", () => {
  fs.emptyDirSync("./dist")
  fs.removeSync("./dist")

  gulp.src(ASSET_FILES).pipe(gulp.dest("dist"))

  gulp
    .src("./jsonFiles/**/*.json")
    .pipe(
      merge({
        fileName: "bitcoin-com-rest-v2.json"
      })
    )
    .pipe(gulp.dest("./dist/public"))
})

var RepoReport = require('./repo_report');

//var report = new RepoReport('/home/vagrant/dotfiles');
var report = new RepoReport('c:/Users/Tom/Code/dotfiles');
report.run(function (report) {
  console.log(report.commitCount);
  console.log(report.filetypeCounts);
  console.log(report.results);
});

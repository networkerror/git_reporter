var Git = require('git-wrapper');

// Reference log query
//  git log --pretty=tformat:"%h %ad" --numstat -i --author="\(tom hood.*\)\|\(thomas hood.*\)\|\(neteworkerror.*\)" --all --date=short --no-merges

/**
 * Parsed data from a repo
 * @param String 	Path to repo
 **/
function RepoReport(repoPath) {
	this.results = [];
	this.commitCount = 0;
	this.filetypeCounts = {};

	var delimiter = '---';
	this.options = {
	  i: true, // Ignore case
	  author: '"\\(tom hood.*\\)\\|\\(thomas hood.*\\)\\|\\(neteworkerror.*\\)"',
	  all: true
	};

	var git = new Git({ 'git-dir': repoPath + '/.git' });
	var _this = this;

	/**
	 * Parse the results from the specified git repo
	 * Notify callback when finished (and pass a reference to _this)
	 * @param callback Function
	 **/
	this.run = function run(callback) {
		_this.options.pretty = 'tformat:"' + delimiter + '%h %ad"';
		_this.options.numstat = true;
		_this.options.date = 'short';
	  _this.options['no-merges'] = true;

		git.exec('log', _this.options, [], function (err, msg) { parseResults(err, msg); callback(_this); });
	};

	/*
	Reference commit string:
	88a3f98 2014-04-30

	3       3       README.md
	0       2       aliases.source
	18      0       configs/StockUbuntuVagrantfile
	65      0       configs/vimrc
	-       -       configs/windows/WinSplitSettings.export
	4       0       configs/windows/autohotkeys.ahk
	0       4       gitconfig.source
	16      0       install/windows_packages_WIP
	0       2       prompt_ubuntu.source
	0       1       source_this
	2       0       sources/aliases.source
	4       0       sources/gitconfig.source
	2       0       sources/prompt_ubuntu.source
	1       0       sources/source_this
	0       65      vimrc
	*/
	function parseCommit(commit) {
		_this.commitCount++;
		var lines = commit.split("\n");
		var entry = {};
		entry.title = parseCommitTitle(lines.shift());

		// Clear the empty lines at the top and bottom
		lines.shift();
		lines.pop();

		entry.files = lines.map(parseCommitFile);

		return entry;
	}

	/**
	 * Parse the first line from a commit and return the data
	 * @param String  "88a3f98 2014-04-30"
	 * @return Object { hash: ..., date: ... }
	 **/
	function parseCommitTitle(title) {
		var pieces = title.split(' ');
		if (pieces.length !== 2) {
		  throw "Invalid title: " + title;
		}
		return {
			hash: pieces[0],
			date: pieces[1]
		};
	}

	/**
	 * Parse a line from the commit report and return the file commit details.
	 * Also updates an internal counter of changes by file-type.
	 * @param String  "18      0       configs/StockUbuntuVagrantfile"
	 * @return Object { additions: (int), filename: (string) }
	 **/
	function parseCommitFile(line) {
		var pieces = line.split('\t');
		var stats = {
			additions: parseInt('0' + pieces.shift().replace(/\D/g,'')),
			filename: pieces.pop()
		};
		stats.filetype = getFiletype(stats.filename);

		appendToFiletypeCounts(stats);
		return stats;
	}

	/**
	 * Figure out the filetype for the specified filename
	 * If unknown, return null
	 * @param filetype String
	 **/
	function getFiletype(filename) {
		var pieces = filename.split('.');
		if (pieces.length <= 1) {
			return null;
		}
		if (pieces[0].length === 0) {
			return null;
		}
		return pieces.pop();
	}

	/**
	 * Add a commit file object to the filetypes counter
	 * @param fileStats Object  { filetype: ..., additions: ... }
	 **/
	function appendToFiletypeCounts(fileStats) {
		var filetype = fileStats.filetype;
		if (!filetype) {
			return;
		}
		var counts = _this.filetypeCounts;
		if (!counts[filetype]) {
			counts[filetype] = 0;
		}
		counts[filetype] += fileStats.additions;
	}

	function parseResults(err, msg) {
		var commits = msg.split(delimiter);
		// Remove first entry - it's a blank
		commits.shift();
		_this.results = commits.map(parseCommit);
	}
	this.parseResults = parseResults;
}

var report = new RepoReport('/home/vagrant/dotfiles');
report.run(function (report) {
	console.log(report.commitCount);
	console.log(report.filetypeCounts);
});

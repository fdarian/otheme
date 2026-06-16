# typed: false
# frozen_string_literal: true

# Formula for otheme — a Node-based CLI.
#
# This file is intended to live in a Homebrew tap repo at
# fdarian/homebrew-tap (i.e. github.com/fdarian/homebrew-tap).
# Drop it at Formula/otheme.rb in that repo.
#
# ASSUMPTIONS:
# - The tap repo exists at github.com/fdarian/homebrew-tap.
# - The otheme package has been published to npm at least once under the
#   name `otheme` before users can `brew install fdarian/tap/otheme`.
# - The `url` and `sha256` fields below must be updated on each release.
#   The CI release workflow (release.yml) is the right place to automate this.
# - Changeset release tags use the format `otheme@<version>`; URLs encode
#   `@` as `%40` (see url fields below).
#
# To update after a new release:
#   1. Download the tarball for the new version.
#   2. Run: shasum -a 256 <tarball>
#   3. Update `url` and `sha256` in this formula.
#   4. Commit and push to fdarian/homebrew-tap.

class Otheme < Formula
  desc "Apply shared themes across editor and terminal targets"
  homepage "https://github.com/fdarian/otheme"
  url "https://registry.npmjs.org/otheme/-/otheme-1.0.0.tgz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"
  license "Apache-2.0"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "otheme", shell_output("#{bin}/otheme --help")
  end
end

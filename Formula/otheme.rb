# typed: false
# frozen_string_literal: true

# This file is a reference copy of the Homebrew formula for otheme.
# The authoritative formula lives in the tap repo at fdarian/homebrew-tap
# (Formula/otheme.rb) and is auto-updated by CI on each release via
# apps/cli/scripts/update-homebrew.ts.

class Otheme < Formula
  desc "Apply shared themes across editor and terminal targets"
  homepage "https://github.com/fdarian/otheme"
  version "PLACEHOLDER"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/fdarian/otheme/releases/download/otheme%40PLACEHOLDER/otheme-darwin-arm64.tar.gz"
      sha256 "PLACEHOLDER"
    else
      url "https://github.com/fdarian/otheme/releases/download/otheme%40PLACEHOLDER/otheme-darwin-x64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/fdarian/otheme/releases/download/otheme%40PLACEHOLDER/otheme-linux-arm64.tar.gz"
      sha256 "PLACEHOLDER"
    else
      url "https://github.com/fdarian/otheme/releases/download/otheme%40PLACEHOLDER/otheme-linux-x64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  def install
    bin.install "otheme"
  end
end

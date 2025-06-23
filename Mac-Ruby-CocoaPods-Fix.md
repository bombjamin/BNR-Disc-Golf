# Fix Ruby Version for CocoaPods Installation

## Your Issue
Your Mac has Ruby 2.6.10, but CocoaPods needs Ruby 3.1+.

## Solution: Install via Homebrew (Recommended)

Run these commands in Terminal:

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install CocoaPods via Homebrew
brew install cocoapods

# Setup CocoaPods
pod setup
```

## Alternative: Update Ruby First

If you prefer to update Ruby:

```bash
# Install rbenv to manage Ruby versions
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash

# Add to your shell profile
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# Install latest Ruby
rbenv install 3.3.0
rbenv global 3.3.0

# Now install CocoaPods
gem install cocoapods
pod setup
```

## Verify Installation

After installation, verify with:
```bash
pod --version
```

You should see a version number like `1.15.2`.

## Continue to Step 3

Once `pod --version` works, proceed with downloading the iOS project and running `pod install`.
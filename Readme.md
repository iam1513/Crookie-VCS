# Crookie

Crookie is a lightweight version control system implemented in Node.js, inspired by Git. It provides basic functionality for tracking changes in your projects.

## Features

- Initialize a new repository
- Add files to staging area
- Commit changes
- View commit history
- Show differences between commits

## Installation

1. Ensure you have Node.js installed on your system.
2. Clone this repository:
   git clone https://github.com/yourusername/crookie.git
3. Navigate to the project directory:
   cd crookie
4. Install dependencies:
   npm install

## Usage

Crookie provides a command-line interface for various operations:

### Initialize a new repository

.\run-crookie.mjs init

### Add a file to the staging area

.\run-crookie.mjs add <file>

### Commit changes

.\run-crookie.mjs commit "<message>"

### View commit history

.\run-crookie.mjs log

### Show differences for a specific commit

.\run-crookie.mjs show <commitHash>

## How It Works

Crookie creates a `.crookie` directory in your project folder to store all version control information. It uses SHA-1 hashing for unique identifiers and stores objects in a flat file system.

## Dependencies

- path
- fs/promises
- crypto
- diff
- chalk
- commander

#!/user/bin/env node
// Shabang "#!"
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { diffLines } from "diff";
import chalk from "chalk";
import { Command } from "commander";

const program = new Command();

class Crookie {
  constructor(repoPath = ".") {
    this.repoPath = path.join(repoPath, ".crookie"); // To make .crookie inside the folder user is working in
    this.objectsPath = path.join(this.repoPath, "objects"); // To make .crookie/objects
    this.headPath = path.join(this.repoPath, "HEAD"); //.crookie/HEAD
    this.indexPath = path.join(this.repoPath, "index"); // To keep the data of staging area .crookie/index
    this.init();
  }

  async init() {
    await fs.mkdir(this.objectsPath, { recursive: true });
    try {
      await fs.writeFile(this.headPath, "", { flag: "wx" }); // wx : open for writing but if already exist , then throw error
      await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: "wx" });
    } catch (error) {
      console.log("Already initialized .crookie folder");
    }
  }

  // Conversion to HASH
  hashObject(content) {
    return crypto.createHash("sha1").update(content, "utf-8").digest("hex"); // Coversion then reading hex and stuff
  }

  async add(fileToBeAdded) {
    // fileToBeAdded ---> Path to be added
    const fileData = await fs.readFile(fileToBeAdded, { encoding: "utf-8" }); // Read file
    const fileHash = this.hashObject(fileData); // creation of hash
    console.log(fileHash);
    const newFileHashedObjectPath = path.join(this.objectsPath, fileHash); // .crookie/objects/abc123
    await fs.writeFile(newFileHashedObjectPath, fileData);
    await this.updateStagingArea(fileToBeAdded, fileHash);
    console.log(`Added ${fileToBeAdded}`);
  }

  async updateStagingArea(filePath, fileHash) {
    const index = JSON.parse(
      await fs.readFile(this.indexPath, { encoding: "utf-8" })
    );
    index.push({ path: filePath, hash: fileHash });
    await fs.writeFile(this.indexPath, JSON.stringify(index));
  }

  async commit(message) {
    const index = JSON.parse(
      await fs.readFile(this.indexPath, { encoding: "utf-8" })
    );

    const parentCommit = await this.getCurrentHead();

    const commitData = {
      timeStamp: new Date().toISOString(),
      message,
      files: index,
      parent: parentCommit,
    };

    const commitHash = this.hashObject(JSON.stringify(commitData));
    const commitPath = path.join(this.objectsPath, commitHash);

    await fs.writeFile(commitPath, JSON.stringify(commitData));
    await fs.writeFile(this.headPath, commitHash); // update head to point to the new commit
    await fs.writeFile(this.indexPath, JSON.stringify([])); // clear the staging area

    console.log(`Commit successfully created: ${commitHash}`);
  }

  async getCurrentHead() {
    try {
      return await fs.readFile(this.headPath, { encoding: "utf-8" });
    } catch (error) {
      return null;
    }
  }

  async log() {
    let currentCommitHash = await this.getCurrentHead();
    while (currentCommitHash) {
      const commitData = JSON.parse(
        await fs.readFile(path.join(this.objectsPath, currentCommitHash), {
          encoding: "utf-8",
        })
      );

      console.log(
        `commit : ${currentCommitHash}\nDate${commitData.timeStamp}\n${commitData.message}\n\n`
      );
      currentCommitHash = commitData.parent;
    }
  }

  async showCommitDifference(commitHash) {
    try {
      const commitData = JSON.parse(await this.getCommitData(commitHash));
      if (!commitData) {
        console.log("Commit not found");
        return;
      }

      console.log("Changes in the last commit are : ");

      for (const file of commitData.files) {
        console.log(`File: ${file.path}`);
        const fileContent = await this.getFileContent(file.hash);
        console.log(fileContent);

        if (commitData.parent) {
          // Get the committed data from parent
          const parentCommitData = JSON.parse(
            await this.getCommitData(commitData.parent)
          );
          const parentFileContent = await this.getParentFileContent(
            parentCommitData,
            file.path
          );

          if (parentFileContent) {
            console.log("\nDiff: ");
            const diff = diffLines(parentFileContent, fileContent);
            console.log(diff);

            diff.forEach((part) => {
              if (part.added) {
                process.stdout.write(chalk.green("++" + part.value));
              } else if (part.removed) {
                process.stdout.write(chalk.red("--" + part.value));
              } else {
                process.stdout.write(chalk.grey(part.value));
              }
            });

            console.log();
          } else {
            console.log("New file commit");
          }
        } else {
          console.log("First Commit");
        }
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  async getParentFileContent(parentCommitData, filePath) {
    const parentFile = parentCommitData.files.find(
      (file) => file.path === filePath
    );
    // Get the file content from the Parent commit
    if (parentFile) {
      return await this.getFileContent(parentFile.hash);
    }
  }

  async getCommitData(commitHash) {
    const commitPath = path.join(this.objectsPath, commitHash);
    try {
      return await fs.readFile(commitPath, { encoding: "utf-8" });
    } catch (error) {
      console.log("Failed to read the data", error);
      return null;
    }
  }

  async getFileContent(fileHash) {
    const objectPath = path.join(this.objectsPath, fileHash);
    return fs.readFile(objectPath, { encoding: "utf-8" });
  }
}

// (async () => {
//   const crookie = new Crookie();
//   // await crookie.add("sample.txt");
//   // await crookie.add("sample2.txt");
//   // await crookie.commit("Second Commit");

//   // await crookie.log();
//   await crookie.showCommitDifference(
//     "02abf0c77951aaf45b68bb9ca13f61ae4c91b914"
//   );
// })();

program.command("init").action(async () => {
  const crookie = new Crookie();
});

program.command("add <file>").action(async (file) => {
  const crookie = new Crookie();
  await crookie.add(file);
});

program.command("commit <message>").action(async (message) => {
  const crookie = new Crookie();
  await crookie.commit(message);
});

program.command("log").action(async () => {
  const crookie = new Crookie();
  await crookie.log();
});

program.command("show <commitHash>").action(async (commitHash) => {
  const crookie = new Crookie();
  await crookie.showCommitDifference(commitHash);
});

program.parse(process.argv);

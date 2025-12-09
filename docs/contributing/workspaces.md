# Using workspaces to develop the Web IDE

KhulnaSoft team members can use [KhulnaSoft Workspaces](https://docs.gitlab.com/ee/user/workspace/)
to develop the Web IDE. You can create a new workspace from either the project page or a merge request page.

## Creating a workspace from the project page

1. Open the [Web IDE project](https://gitlab.com/khulnasoft/web-ide).
1. In the Git revision dropdown, select the branch you want to work on.
1. Select the **Code** button, then select **New workspace**.
1. You will be redirected to the "New Workspace" form.
1. Select **Create Workspace**.
1. Once the workspace is created, you can open it in VS Code for the Web.

## Creating a workspace from a merge request

1. Navigate to any merge request in the [Web IDE project](https://gitlab.com/khulnasoft/web-ide/-/merge_requests).
1. Select the **Code** button, then select **Open in Workspace**.
1. You will be redirected to the "New Workspace" form with the merge request's project and source branch pre-selected.
1. Select **Create Workspace**.
1. Once the workspace is created, you can open it in VS Code for the Web.

## Initial setup

Once workspace is running, a [post-script command](/.devfile.yaml) called `install-dependencies` runs in the background asynchronously to install mise dependencies and yarn dependencies. This process takes a few minutes to complete. We recommend waiting until the post-script finishes before running other commands.

To check the progress, run:

```bash
cat ../workspace-logs/poststart-stdout.log
```

---
stage: Create
group: remote development
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Maintainer Responsibility

Maintainers of the KhulnaSoft Web IDE are responsible for:

1. Reviewing and merging Merge Requests for the KhulnaSoft Web IDE.
2. Joining the internal `#f_vscode_web_ide` Slack channel, to stay up-to-date
   with KhulnaSoft Web IDE specifics.

## Code Review

As a Maintainer, you will be pinged and assigned Merge Requests to review
and merge. For example:

```
Hey @pslaughter! Can you please review and merge this MR? Thanks!

/assign_reviewer @pslaughter
```

When reviewing a Merge Request, please use your best
discretion to ensure that a Merge Request meets our functional
and internal quality criteria. Some questions to ask yourself:

### Reviewing the functionality

1. Is the user-facing change something we actually want to do? You can
   check this by viewing issues referenced in the Merge Request description.
1. Does the user-facing change work as expected? Are there any edge cases
   that are accidentally or intentionally over-looked?
1. Does the pre-existing functionality still work as expected?
1. Does the Merge Request pass a reasonable smoke test?

As a Maintainer, you do not have to verify everything yourself. You may
choose to delegate to the contributor (or a Domain Expert). For example:

```
**question:** This looks like it might cause issues when the user is not an admin. Have we tested this scenario? Could you include a screenshot for this please?
```

### Reviewing the maintainability

1. Are any linting rules explicitly disabled? Why?
1. Is there a simpler approach? Why was this approach not pursued?
1. Are there any parts that are hard to follow?
1. Does this change hurt any pre-existing cohesion and responsibilities?
1. Does this change add any undesirable coupling?

## Merging

When a Merge Request is ready to merge:

1. Approve the Merge Request.
1. Check that the commit messages follow the [style guide](./style-guide.md#conventional-commits). If the commits do not follow the style guide
   (or includes `fixup!` commits), you may consider either:
   1. Squash the commits on merge through the KhulnaSoft UI. Check the **Squash commits** checkbox and **Modify commit messages** next to the **Merge** button. Modify the squash commit message following the [style guide](./style-guide.md#conventional-commits). The merge commit message does not need to follow the style guide.
   1. Ask the Merge Request contributor to squash the commits themselves.
1. Click **Merge**, which should add the Merge Request to the Merge Train.
   You _should not_ need to start a new pipeline.

## References

- [Code Review Values](https://about.gitlab.com/handbook/engineering/workflow/reviewer-values/) for how we balance priorities and
  communication during code review.
- [Project members page](https://gitlab.com/khulnasoft/web-ide/-/project_members?with_inherited_permissions=exclude&sort=access_level_desc) to find the current list of active maintainers.

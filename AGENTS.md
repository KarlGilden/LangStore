# LangStore
- Before each new repository task, run `git status --porcelain=v1 --untracked-files=all`; if staged, unstaged, untracked, or conflicted changes exist, stop before editing or switching branches and ask whether to continue on the current branch, explaining the risk of mixing work.
- Use a task branch for implementation; never commit directly to main. Preserve unrelated changes; never stash, discard, push, or merge without permission.
- Before changing product behaviour, read [langstore-v0.md](langstore-v0.md); keep unresolved decisions open.
- Before technical planning, backend implementation, or review, read [langstore-technology-spec.md](langstore-technology-spec.md) for the selected stack and technical design; distinguish confirmed decisions from proposals.
- Before backend implementation or review, read [ENGINEERING.md](ENGINEERING.md) for architecture, coding, data, and verification rules.
- Implement only requested work; planning is not permission to implement. Prefer small changes without speculative abstractions or unrelated refactors.
- Handle failures explicitly, protect user isolation and secrets, and never treat exposure as proof of understanding.
- Run relevant available checks; report changes, results, and limitations honestly.

# Reflection

**pnihalan:**

**Recitation group members (Task 2):**
n/a
---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

Idempotence (merging an already-merged list changes nothing) is a valid property because it follows directly from the spec, but it's weak here because the provided mutants return the same wrong answer every time, so running the merge twice doesn't expose them, and only one mutant gets caught. It would catch a bug where the merge compares each interval to the previous input interval instead of the one being built, since the first pass leaves overlapping output that a second pass would then combine.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

The mutant mergesIntegerNeighbors was flaky because of my generator. This mutant wrongly joins intervals that are one apart, even though there is a gap. My property already checked the right thing that every point covered by the input should be covered by the output, and nothing more. But I only tested random points, and a random point rarely lands in a small gap. So the test caught the bug in only 4 of 5 runs. To fix it, I also tested each interval's endpoints and the points just beside them. That way a point always lands in any gap, and the bug was caught every time.
  ~ mergesIntegerNeighbors  flaky: killed in 4/5 runs  by: output covers exactly the same points as the input
Mutation score: 5/7 killed (71%)
  ✔ mergesIntegerNeighbors  killed  by: output covers exactly the same points as the input
Mutation score: 6/7 killed (86%)



### 3. Reading a counterexample
Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

singlePass     killed  by: never credits a letter more times than the secret contains it
      Counterexample: ["AACAA","AAAAA"]
The secret has four A's, and the guess matches all four at positions 1, 2, 4 and 5, so the spec makes those four positions green. Each green uses up one of the secret's A's. When the A at position 3 (where the secret has C) is checked for yellow, no A is left in the secret. A yellow needs an occurrence "not already used by a green", so position 3 must be black, and the correct answer is G G B G G. singlePass hands out colors in a single left to right pass, so it gives position 3 a yellow before it reaches the greens at positions 4 and 5. It returns G G Y G G, which is five A's when the secret only has four, and that violates the spec.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.


Hint Mode gives students hints that get more detailed each time they ask for another one. A function that would benefit from property based testing is SessionHint.level(prompts) in packages/opencode/src/session/hint.ts. It looks at the student's messages and decides which hint level (1 to 4) to give next. Right now it's tested with a few hand picked conversations, but the input is any list of messages, so there are many combinations we haven't tried.

Property 1 (invariant): for any list of messages, including an empty one, the level is always a whole number from 1 to 4 (levels.length). It should never be 0, never go past the most detailed level, and never land on a level that doesn't exist.

Property 2 (metamorphic): adding an "another hint" message to the end of a conversation never makes the level go down and never makes it jump by more than one. Asking for more help should only ever move the student up one step at a time.

We would need a naive generator would make each message random text with a random hint flag. But random text almost never matches the "another hint" patterns, so we would almost never get a run of hint requests, and the interesting cases would never be tested. Instead, the generator should build each message by picking from a few kinds like real "another hint" phrases with different capitalization and punctuation, new questions, messages sent with Hint Mode off, and tricky messages that look like requests but are not actually one. It should also make conversations long enough to have more than four requests in a row so the cap gets tested.
# Beginner Explanation Protocol

The card set must teach, not merely summarize. Assume the reader recognizes the topic name but does not know the underlying mechanism.

## Explanation Completeness

Before storyboarding, answer these six questions in plain language:

1. **What is it?** One precise sentence without unexplained jargon.
2. **What is it not?** Correct the most likely misconception or analogy boundary.
3. **How does it work?** Show one causal chain: input -> mechanism -> result.
4. **What does it look like in a real example?** Use a specific input and observable outcome.
5. **Why should the reader care?** Connect it to cost, behavior, decision, risk, or action.
6. **What can the reader do next?** Give one test, choice, or behavior.

If one of questions 1-5 is unanswered, the educational card set is incomplete.

## Writing Rules

- Write conclusions as complete sentences, not labels or keyword piles.
- Use the pattern **plain statement -> example -> consequence**.
- Explain a technical term at first use. Do not rely on parentheses containing another technical term.
- Prefer “because X, therefore Y” over vague claims such as “it affects efficiency.”
- Use analogies to create intuition, then state where the analogy stops being exact.
- Keep one page focused, but allow 2-4 short explanatory sentences when needed. “One message per page” does not mean “one slogan per page.”
- Do not remove necessary reasoning merely to make the card visually sparse. Change the layout or add a page instead.

## Card-Set Teaching Arc

Recommended teaching arc. Let the source decide the exact page count; most card sets land at 4-7 pages including the cover.

1. **Problem / hook:** a familiar symptom or question.
2. **Plain definition:** what it is, plus what it is not.
3. **Concrete example:** show the mechanism on a specific case.
4. **Mechanism / consequence:** explain why the observed result happens.
5. **Practical significance:** show the decision, cost, or risk it changes.
6. **Boundary / misconception:** clarify exceptions when they matter.
7. **Action / test:** let the reader verify or apply the idea.

Combine adjacent roles only when the explanation remains complete.

## Illustration Contract

Every explanatory illustration must have:

- a question it answers;
- an observable before/after, action, relationship, and consequence;
- nearby HTML copy that states what the reader should notice;
- a caption or takeaway connecting the picture back to the definition.

An image of related objects without a visible relationship is decorative, not explanatory.

## Visual Explanation Chain

An illustration-led teaching page must map the concept into a visible causal chain:

```text
source / input -> transformation or rule -> intermediate state -> result -> practical consequence
```

The illustration should usually render only the single hardest-to-imagine stage or transition. Use HTML arrows, labels, examples, or result panels to complete the five-stage chain. The full page, not the bitmap alone, must make the direction and causal relationship unambiguous.

Before generating an illustration, create a visual mapping table:

| Concept element | Visible representation | Reader should infer |
|---|---|---|
| original input | one long sentence strip | AI receives continuous text |
| transformation | cutting / splitting machine | text is divided before processing |
| intermediate state | several unequal blocks | tokens are processing units |
| result | blocks entering the model | the model processes token units |
| consequence | counter, capacity box, or cost meter | more tokens use more capacity or budget |

If a required concept element has no visible representation or nearby explanation, the visual explanation is incomplete.

## Illustration-Led Page Rules

- Do not reuse one generic illustration to explain two different teaching claims unless it visibly supports both.
- Prefer a diagrammatic scene with direction, state change, and outcome over a charming standalone character scene.
- Add HTML arrows, numbered stages, braces, or captions when the generated image cannot communicate sequence precisely.
- Every annotation must point to a specific visual element. Floating commentary beside an image is insufficient.
- The page must state both **what is happening in the picture** and **what that means for the concept**.
- If the full mechanism cannot fit clearly on one page, split it into two pages instead of simplifying it into a slogan.

## Visual Explanation QA

Perform two separate checks:

1. **Image-only check:** Hide the explanatory paragraphs. Can a beginner identify the input, action, direction, and result?
2. **Page check:** With text restored, can a beginner explain why the result happens and connect it to the real concept?

An image may pass as an illustration but fail as an explanation. Revise until both checks pass.

## Beginner QA

Ask a simulated beginner:

- After seeing the cards, can they explain the concept in their own words?
- Can they predict what happens in one new example?
- Can they name one common misunderstanding?
- Can they say why the concept matters to them?

If the answer relies on guessing from keywords, revise the copy or add a page.

# Feedback
## 2026-11-04 from TV contact
- graphics in folder tv-graphics/ use the notification pngs instead of the current ones; I understand that they can supply more pngs and we need to estimate how many we need to fill 1min task duration
- Is it possible to make the game last longer, like 1 min ? 
  - TAT: here we estimate number of trials necessary for 60s, at current scroll rate
  - TAT: I predict that we need to have more sparse distraction rate at 1min duration, and also have a display duration (try 4 sec to start) after which the distraction quickly fades over 500ms
- Also, can we use this coral pink provided by the show's team as the background color? And if it doesn't work well with the numbers, can we use the blue they sent?
  - TAT: we try with CYR_BKG_ROSE CORAIL-CREVES, but I predict that we need a darkened alpha layer between bkgnd and the task graphics to get necessary contrast



## 2026-11-03 From TV contact
- Make the numbers easier to see (using bold text and a larger font size)?
- Increase the size of the words "CONSONNE" (consonant) and "VOYELLE" (vowel), and ensure they are in French?
- Improve the contrast between the background, the numbers, and the words?
- Create notifications—some styled like text messages and others as pop-ups—that appear in various locations on the screen (rather than always in the same spot)?
- Add sound to the experience, both during gameplay and as feedback for correct or incorrect answers?

Laure:
"The blue used for the word 'consonne' is hard to see; perhaps the gray background isn't the best choice.
Would it be possible for the scrolling vowels and consonants to change color based on whether the answer is correct or incorrect—for example, blue (provided it’s clearly visible) for a correct answer, and red for an incorrect one?"
### Notes TAT
- 'Numbers' likely refers to the final stats screen - we should try simplifying and make things larger for the TV context
- The grey background was due to the eyetracking context; for TV the requirements are different - perhaps black is the natural one?
- the notifications now become more like ads on a webpage - they should not occlude the actual decision area or the progress bar, and the notification 'sprite area' becomes conditioned on the class of visualisation: 'text message': smaller, with rounded edge, should look like a typical instant message; 'advert': oblong box if appears at the bottom of the screen, square at either side of the scrolling letters
- do sound last, inspired by classical game sounds
/**
 * Wordle Unlimited Solver & Vowel Helper Engine
 * Evaluates candidate words based on green (correct), yellow (present), and gray (absent) letter feedback.
 * Analyzes vowel density and highlights optimal starting words.
 */

const WordleSolver = {
  // High-vowel starter words by word length
  bestStarters: {
    3: ["AIR", "EAT", "OAT", "AGE", "ERA", "ONE"],
    4: ["AREA", "EASY", "AUTO", "IDEA", "ALSO", "UNIT"],
    5: ["ADIEU", "AUDIO", "CANOE", "ROATE", "ORATE", "RAISE", "ARISE", "SOARE"],
    6: ["AVENUE", "AERIAL", "AURA", "OUTEAT", "ISLAND", "AUTUMN"],
    7: ["ACQUIRE", "AUCTION", "ARTICLE", "ANXIETY", "OUTSIDE"]
  },

  // Count vowels in a word
  countVowels(word) {
    const vowels = "aeiouAEIOU";
    let count = 0;
    for (let char of word) {
      if (vowels.includes(char)) count++;
    }
    return count;
  },

  // Filter word list based on guesses history
  // guessHistory: Array of { word: "ADIEU", states: ["correct", "present", "absent", "correct", "absent"] }
  filterWords(wordList, guessHistory) {
    if (!guessHistory || guessHistory.length === 0) return wordList;

    return wordList.filter(candidate => {
      const candUpper = candidate.toUpperCase();

      for (let attempt of guessHistory) {
        const guess = attempt.word.toUpperCase();
        const states = attempt.states;

        for (let i = 0; i < guess.length; i++) {
          const char = guess[i];
          const state = states[i];

          if (state === "correct") {
            if (candUpper[i] !== char) return false;
          } else if (state === "present") {
            if (candUpper[i] === char) return false;
            if (!candUpper.includes(char)) return false;
          } else if (state === "absent") {
            // Check if char is present elsewhere in guess as green/yellow
            const charCountInGuessAsCorrectOrPresent = guess.split('').filter((c, idx) => c === char && (states[idx] === 'correct' || states[idx] === 'present')).length;
            
            if (charCountInGuessAsCorrectOrPresent === 0) {
              if (candUpper.includes(char)) return false;
            } else {
              // If char appears in guess as green/yellow, then absent means it doesn't appear MORE times in candidate
              if (candUpper[i] === char) return false;
            }
          }
        }
      }
      return true;
    });
  },

  // Rank candidate words by letter frequency / vowel balance
  rankCandidates(candidates) {
    if (candidates.length === 0) return [];
    
    // Frequency map of letters in current candidates
    const freq = {};
    candidates.forEach(word => {
      const uniqueChars = new Set(word.toUpperCase());
      uniqueChars.forEach(ch => {
        freq[ch] = (freq[ch] || 0) + 1;
      });
    });

    return candidates.map(word => {
      let score = 0;
      const uniqueChars = new Set(word.toUpperCase());
      uniqueChars.forEach(ch => {
        score += freq[ch] || 0;
      });
      // Small bonus for unique letters
      score += uniqueChars.size * 2;
      return { word: word.toUpperCase(), score: score, vowels: this.countVowels(word) };
    }).sort((a, b) => b.score - a.score);
  }
};

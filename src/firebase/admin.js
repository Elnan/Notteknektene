import { notteknekteneDb } from "./firebase-config-notteknektene";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// Function to calculate points for a submission
export const calculatePoints = (submission, isFastest) => {
  let points = 0;
  if (submission.status === "correct") {
    if (submission.usedHint) {
      points = 4;
    } else {
      points = 7;
    }
    // Legacy bonus system removed - no longer awarding bonus points for fastest submission
  }
  return points;
};

// Function to update scores in Firebase and RoundTable collection
export const updateScores = async (
  updatedSubmissions,
  participants,
  roundNumber,
  seasonNumber
) => {
  const batch = writeBatch(notteknekteneDb);

  const scoresMap = new Map();

  for (const participant of participants) {
    const participantName = participant.name || participant.displayName;
    const submission = updatedSubmissions.find(
      (sub) => sub.userId === participant.id
    );
    const points = submission ? calculatePoints(submission, false) : 0;

    const totalScoresRef = doc(
      notteknekteneDb,
      `TotalScores/${participantName}`
    );
    const totalScoresDoc = await getDoc(totalScoresRef);

    let scores = [];
    if (totalScoresDoc.exists()) {
      scores = totalScoresDoc.data().scores;
    } else {
      scores = Array(roundNumber).fill(0); // Initialize scores array with zeros
    }

    // Add points for the new round
    scores[roundNumber - 1] = points;

    // Replace undefined values with zeros
    scores = scores.map((score) => (score === undefined ? 0 : score));

    scoresMap.set(participantName, scores);

    batch.set(totalScoresRef, {
      name: participantName,
      scores: scores,
    });

    if (submission) {
      // Archive submissions
      const archiveRef = doc(
        notteknekteneDb,
        `archivedSubmissions/season_${seasonNumber}/round_${roundNumber}/${submission.id}`
      );
      batch.set(archiveRef, submission);

      // Update submission with points and status
      const submissionRef = doc(
        notteknekteneDb,
        `submissions/${submission.id}`
      );
      const submissionDoc = await getDoc(submissionRef);
      if (submissionDoc.exists()) {
        batch.update(submissionRef, {
          points,
          accepted: submission.status === "correct",
        });
      } else {
        console.error(`No document to update: ${submissionRef.path}`);
        batch.set(submissionRef, submission);
      }
    }
  }

  await batch.commit();
  console.log("Total scores updated successfully!");
};

// LEGACY FUNCTION REMOVED
// The finalizeSeason function has been replaced with the new comprehensive
// archiving system in new-database-utils.js
// Use finishSeason() from new-database-utils.js instead, which includes:
// - Comprehensive data archiving (archiveSeason)
// - Proper season completion marking
// - All game and participant data preservation

// Function to clear RoundTable collection
export const clearRoundTable = async (currentRound) => {
  const roundTableCollection = collection(
    notteknekteneDb,
    `RoundTable/Runde${currentRound}/users`
  );
  const roundTableSnapshot = await getDocs(roundTableCollection);
  const batch = writeBatch(notteknekteneDb);
  roundTableSnapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });
  await batch.commit();
};

// Function to delete all submissions
export const deleteAllSubmissions = async () => {
  const submissionsCollection = collection(notteknekteneDb, "submissions");
  const submissionsSnapshot = await getDocs(submissionsCollection);
  const batch = writeBatch(notteknekteneDb);
  submissionsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log("All submissions deleted successfully!");
};

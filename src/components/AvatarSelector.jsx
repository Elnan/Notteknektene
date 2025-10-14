import React, { useState, useEffect } from "react";
import { updateUserAvatar } from "../firebase/notteknektene-firebase-utils";
import { useAuth } from "../context/authContext";
import styles from "./AvatarSelector.module.css";
import Button from "./Button";

// List of available avatars from the public/avatars folder
const AVAILABLE_AVATARS = [
  "avatar_man_male_afro.png",
  "christmas_clous_santa.png",
  "ozzy_avatar_singer_male_rock.png",
  "person_avatar_pilot_traveller.png",
  "avatar_sluggard_sloth_lazybones.png",
  "bug_spider_avatar_insect.png",
  "joker_squad_woman_avatar_suicide.png",
  "male_trump_avatar_president_donald trump.png",
  "person_avatar_punk_man.png",
  "scientist_avatar_einstein_professor.png",
  "sheep_mutton_animal_avatar.png",
  "ufo_space_alien_avatar.png",
  "artist_monroe_marilyn_avatar.png",
  "avatar_indian_hindi_woman.png",
  "avatar_muslim_man.png",
  "indian_boy_native_kid.png",
  "male_avatar_portrait_man.png",
  "man_portrait_old_male.png",
  "monster_zombie_dead_avatar.png",
  "muslim_avatar_paranja_woman.png",
  "woman_sister_avatar_nun.png",
  "wrestler_man_fighter_luchador.png",
  "avatar_kid_girl_child.png",
  "beard_male_hipster_man.png",
  "grandma_avatar_nanny_elderly.png",
  "halloween_movie_jason_friday.png",
  "indian_male_man_person.png",
  "kid_child_person_girl.png",
  "man_sikh_indian_turban.png",
  "woman_avatar_female_girl.png",
  "avatar_1_woman_portrait_female.png",
  "cactus_pirate_cacti_avatar.png",
  "coffee_cup_zorro_avatar.png",
  "crying_avatar_rain_cloud.png",
  "geisha_avatar_woman_japanese.png",
  "helmet_builder_worker.png",
  "love_addicted_draw_pencil.png",
  "man_comedy_actor_chaplin.png",
  "woman_avatar_female_portrait.png",
  "afro_kid_child_boy.png",
  "avatar_batman_hero_comics.png",
  "avatar_russian_bear_animal.png",
  "boy_kid_person_avatar.png",
  "boy_male_portrait_avatar.png",
  "breaking_chemisrty_heisenberg_avatar_bad.png",
  "child_baby_toddler_kid.png",
  "food_avatar_avocado_scream.png",
  "person_afro_female_woman.png",
  "spirited_no_face_anime_away_nobody.png",
  "afro_avatar_man_male.png",
  "illness_apple_avatar_watch_sick.png",
];

const AvatarSelector = ({ isOpen, onClose, onAvatarSelected }) => {
  const { currentUser, refreshUserData } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);

  useEffect(() => {
    if (currentUser?.avatar) {
      setCurrentUserAvatar(currentUser.avatar);
      setSelectedAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  const handleAvatarSelect = (avatarPath) => {
    setSelectedAvatar(avatarPath);
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || !currentUser) return;

    setIsUpdating(true);
    try {
      await updateUserAvatar(currentUser.uid, selectedAvatar);
      setCurrentUserAvatar(selectedAvatar);
      // Refresh user data in auth context
      await refreshUserData(currentUser);
      onAvatarSelected?.(selectedAvatar);
      onClose();
    } catch (error) {
      console.error("Error updating avatar:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setSelectedAvatar(currentUserAvatar);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Choose Your Avatar</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.currentAvatar}>
            <h3>Current Avatar:</h3>
            <img
              src={
                currentUserAvatar
                  ? `/avatars/${currentUserAvatar}`
                  : "/defaultAvatar.webp"
              }
              alt="Current avatar"
              className={styles.currentAvatarImage}
            />
          </div>

          <div className={styles.avatarGrid}>
            {AVAILABLE_AVATARS.map((avatar) => (
              <div
                key={avatar}
                className={`${styles.avatarOption} ${
                  selectedAvatar === avatar ? styles.selected : ""
                }`}
                onClick={() => handleAvatarSelect(avatar)}
              >
                <img
                  src={`/avatars/${avatar}`}
                  alt={avatar.replace(/_/g, " ").replace(/\.png$/, "")}
                  className={styles.avatarImage}
                />
                <div className={styles.avatarName}>
                  {avatar.replace(/_/g, " ").replace(/\.png$/, "")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            variant="secondary"
            size="small"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleSaveAvatar}
            disabled={!selectedAvatar || isUpdating}
          >
            {isUpdating ? "Saving..." : "Save Avatar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;

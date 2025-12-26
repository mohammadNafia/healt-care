from classes.Display import Display
from classes.FinalScoreboard import FinalScoreboard
from classes.Sounds import Sounds
from classes.TargetArea import TargetArea
from classes.Target import Target
from classes.Text import Text
from classes.Timer import Timer
from time import time
import pygame

class App(object):
    BORDER = 10

    DISPLAY_COLOR = (20, 25, 40)
    DISPLAY_GEOMETRY = [800, 600]
    DISPLAY_TITLE = "Aim Trainer"

    FRAMES_PER_SECOND = 60

    LIVES = 5
    MISSING_SHOTS_DECREASES_LIFE = False

    SCOREBOARD_AREA = 60
    SCOREBOARD_COLOR = (255, 255, 255)
    SCOREBOARD_FONT = ('Arial', 18)
    SCOREBOARD_FORMAT = "Hits:  %i   Accuracy:  %.1f%%   FPS: %i   Targets: %.2f/s   Lives: %i"
    SCOREBOARD_LOCATION = [BORDER+1, 15]

    SOUNDS_BUFFER = 64

    TARGET_ADD_TIME = 0.2
    TARGET_AREA_COLORS = [(30, 35, 50), (45, 50, 65)]
    TARGET_BORDER = 0
    TARGET_AREA_GEOMETRY = [0+BORDER,SCOREBOARD_AREA+BORDER,DISPLAY_GEOMETRY[0]-BORDER,DISPLAY_GEOMETRY[1]-BORDER]
    TARGET_COLORS = [(255, 60, 60), (255, 255, 255)]
    TARGET_LIMIT_PER_SECOND = None
    TARGET_RADIUS = 40
    TARGETS_PER_SECOND = 1.8
    TARGET_SPEED = 0.4

    FINAL_SCOREBOARD_BACKGROUND_COLOR = (25, 30, 45)
    FINAL_SCOREBOARD_BORDER = 6
    FINAL_SCOREBOARD_BORDER_COLOR = (100, 150, 255)
    FINAL_SCOREBOARD_FONT = ("Arial", 36)
    FINAL_SCOREBOARD_GEOMETRY = [TARGET_AREA_GEOMETRY[0]+50,TARGET_AREA_GEOMETRY[1]+50,TARGET_AREA_GEOMETRY[2]-50,TARGET_AREA_GEOMETRY[3]-50]
    FINAL_SCOREBOARD_TEXT_COLOR = (220, 220, 255)


    def __init__(self):

        self.sounds = Sounds(self.SOUNDS_BUFFER)
        pygame.init()

        self.display = Display(
            *self.DISPLAY_GEOMETRY,
            self.DISPLAY_TITLE,
            self.DISPLAY_COLOR
            )
        self.__surface = self.display.getSurface()

        self.finalScoreboard = FinalScoreboard(
            self.__surface,
            *self.FINAL_SCOREBOARD_GEOMETRY,
            self.FINAL_SCOREBOARD_FONT,
            self.FINAL_SCOREBOARD_BORDER,
            self.FINAL_SCOREBOARD_BORDER_COLOR,
            self.FINAL_SCOREBOARD_TEXT_COLOR,
            self.FINAL_SCOREBOARD_BACKGROUND_COLOR,
            self.TARGET_COLORS
            )

        self.scoreboardText = Text(
            self.__surface,
            *self.SCOREBOARD_LOCATION,
            text_font=self.SCOREBOARD_FONT,
            text_color=self.SCOREBOARD_COLOR
            )

        self.targetArea = TargetArea(
            self.__surface,
            *self.TARGET_AREA_GEOMETRY,
            self.TARGET_AREA_COLORS
            )

        self.__timer = Timer()
        self.__clock = pygame.time.Clock()


    def captureEvents(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.__stop = True
                break

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.__stop = True
                    break

                enter_or_space = event.key in [pygame.K_RETURN, pygame.K_SPACE]
                if enter_or_space:
                    if not self.__start:
                        self.__start = True

            left_mouse_button = event.type == pygame.MOUSEBUTTONDOWN and event.button == 1
            if left_mouse_button:
                if self.__start:
                    self.sounds.playSound(self.sounds.shooting_sound)
                else:
                    self.sounds.playSound(self.sounds.without_ammunition_sound)
                    continue
                
                target_hit = False
                for target in self.__targets.copy():
                    hit_position = target.checkHit()

                    if hit_position:
                        self.sounds.playSound(self.sounds.metal_hit_sound)
                        self.__shots.append(hit_position)
                        self.__targets.remove(target)
                        self.__hits += 1
                        target_hit = True
                        break

                if not target_hit:
                    if self.MISSING_SHOTS_DECREASES_LIFE:
                        self.__lives -= 1
                    self.__failures += 1


    def createTarget(self):
        target = Target(
            surface = self.__surface,
            area_geometry = self.TARGET_AREA_GEOMETRY,
            radius=self.TARGET_RADIUS,
            target_colors=self.TARGET_COLORS
            )
        self.__targets.append(target)


    def gameOver(self):
        self.__start = False

        total_hits = self.__hits
        total_shots = self.__hits + self.__failures
        accuracy = FinalScoreboard.getAccuracy(total_shots, total_hits)
        targets_per_second = self.__target_per_second
        game_time = self.__timer.getTime()
        shot_positions = self.__shots.copy()

        while not self.__stop and not self.__start:
            self.captureEvents()
            self.display.drawDisplay()
            self.targetArea.drawArea()

            game_over_message = 'GAME OVER:  Click "Enter" or "Space" to continue.'
            self.scoreboardText.setText(game_over_message)
            self.scoreboardText.drawText()

            self.finalScoreboard.drawFinalScoreboard(
                total_hits, accuracy, targets_per_second, game_time, shot_positions
            )

            self.__clock.tick(self.FRAMES_PER_SECOND)
            pygame.display.flip()

        if self.__stop:
            pygame.quit()
        else: 
            self.run()


    def run(self):
        self.__failures = 0
        self.__hits = 0
        self.__stop = False
        self.__targets = []
        self.__shots = []
        self.__lives = self.LIVES
        self.__target_per_second = self.TARGETS_PER_SECOND
        self.__start = True

        self.scoreboardText.setFont(self.SCOREBOARD_FONT)

        self.__timer.start()

        last_target_creation_time = time()
        last_difficulty_increase_time = time()

        while not self.__stop and self.__lives > 0:
            self.captureEvents()

            current_time = time()
            time_since_last_target = current_time - last_target_creation_time
            seconds_between_targets = 1.0 / self.__target_per_second
            
            if time_since_last_target >= seconds_between_targets:
                self.createTarget()
                last_target_creation_time = current_time

            time_since_difficulty_increase = current_time - last_difficulty_increase_time
            if time_since_difficulty_increase >= self.TARGET_ADD_TIME:
                has_no_limit = self.TARGET_LIMIT_PER_SECOND is None
                
                if has_no_limit:
                    can_increase_difficulty = True
                else:
                    under_limit = self.TARGET_LIMIT_PER_SECOND > self.__target_per_second
                    can_increase_difficulty = under_limit
                
                if can_increase_difficulty:
                    difficulty_increase = 1.0 / self.__target_per_second / 100
                    self.__target_per_second += difficulty_increase
                    last_difficulty_increase_time = current_time

            self.update()

        if self.__stop:
            pygame.quit()
        else:
            self.gameOver()


    def setScore(self):
        total_hits = self.__hits
        total_shots = self.__hits + self.__failures
        accuracy = FinalScoreboard.getAccuracy(total_shots, total_hits)
        frames_per_second = self.__clock.get_fps()
        targets_per_second = self.__target_per_second
        remaining_lives = self.__lives
        
        score_text = self.SCOREBOARD_FORMAT % (
            total_hits, accuracy, frames_per_second, targets_per_second, remaining_lives
        )
        self.scoreboardText.setText(score_text)


    def targetAnimation(self):
        targets_copy = self.__targets.copy()
        targets_copy.reverse()
        
        for target in targets_copy:
            try:
                increase_result = target.increase(self.TARGET_SPEED)
                reached_max_size = increase_result == -1
                
                if reached_max_size:
                    target.decreases(self.TARGET_SPEED)
                
                target.drawTarget(border=self.TARGET_BORDER)
            
            except ValueError:
                self.sounds.playSound(self.sounds.target_loss_sound)
                self.__targets.remove(target)
                self.__lives -= 1


    def update(self):
        self.setScore()

        self.display.drawDisplay()
        self.scoreboardText.drawText()

        self.targetArea.drawArea()
        self.targetAnimation()

        self.__clock.tick(self.FRAMES_PER_SECOND)
        pygame.display.flip()

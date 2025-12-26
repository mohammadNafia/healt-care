from classes.Target import Target
from classes.Text import Text
from pygame import Surface
from pygame import draw
from pygame import rect

class FinalScoreboard(object):
    DEFAULT_BACKGROUND_COLOR = (255,255,255)
    DEFAULT_BORDER_SIZE = 5
    DEFAULT_BORDER_COLOR = (139,69,19)
    DEFAULT_TARGET_COLORS = [(255,0,0),(255,255,255)]
    DEFAULT_TEXT_FONT = ("Autumn",20)
    DEFAULT_TEXT_COLOR = (0,0,0)

    TARGET_BORDER = 2
    TARGET_RADIUS = 90
    SHOT_SIZE = int(TARGET_RADIUS/30+0.5)

    def __init__(self,surface,x1,y1,x2,y2,font=DEFAULT_TEXT_FONT,border=DEFAULT_BORDER_SIZE,
    border_color=DEFAULT_BORDER_COLOR,text_color=DEFAULT_TEXT_COLOR,
    background_color=DEFAULT_BACKGROUND_COLOR,target_colors=DEFAULT_TARGET_COLORS):
        if type(surface) is Surface:
            self.__surface = surface
        else: raise TypeError('The argument "surface" must be a Surface object.') 

        self.__surface = surface
        self.__geometry = [x1,y1,x2,y2]
        self.__font = font
        self.__border = border
        self.__border_color = border_color
        self.__text_color = text_color
        self.__background_color = background_color
        self.__target_colors = target_colors


    def __drawBorder(self):
        left = self.__geometry[0]
        top = self.__geometry[1]
        right = self.__geometry[2]
        bottom = self.__geometry[3]
        border_width = self.__border
        
        left_border = rect.Rect(left, top, border_width, bottom - top)
        right_border = rect.Rect(right - border_width, top, border_width, bottom - top)
        top_border = rect.Rect(left, top, right - left, border_width)
        bottom_border = rect.Rect(left, bottom - border_width, right - left, border_width)
        
        all_borders = [left_border, right_border, top_border, bottom_border]
        for border_rect in all_borders:   
            draw.rect(self.__surface, self.__border_color, border_rect)


    def __drawTarget(self,location,shots,target_colors):
        target = Target(
            self.__surface,
            radius=self.TARGET_RADIUS,
            target_colors=target_colors,
            location=location
        )
        target.increase(self.TARGET_RADIUS)
        target.drawTarget(border=self.TARGET_BORDER)
    
        target_diameter = self.TARGET_RADIUS * 2
        target_left = location[0] - self.TARGET_RADIUS
        target_top = location[1] - self.TARGET_RADIUS
        
        for shot in shots:
            shot_percent_x = shot[0]
            shot_percent_y = shot[1]
            
            shot_x = int(target_diameter / 100.0 * shot_percent_x)
            shot_y = int(target_diameter / 100.0 * shot_percent_y)
            
            shot_position_x = target_left + shot_x
            shot_position_y = target_top + shot_y
            shot_color = (0, 0, 0)

            draw.circle(
                self.__surface,
                shot_color,
                [shot_position_x, shot_position_y],
                self.SHOT_SIZE
            )


    def drawFinalScoreboard(self,hits,accuracy,targets_per_second,time,shots):
        left = self.__geometry[0]
        top = self.__geometry[1]
        right = self.__geometry[2]
        bottom = self.__geometry[3]
        width = right - left
        height = bottom - top
        
        background = rect.Rect(left, top, width, height)   
        draw.rect(self.__surface, self.__background_color, background)

        spacing_x = int(0.07 * width)
        spacing_y = int(0.12 * height)

        text_x = left + spacing_x
        hits_text = "Hits: %i" % hits
        accuracy_text = "Accuracy: %.1f%%" % accuracy
        targets_text = "Targets: %.2f/s" % targets_per_second
        time_text = "Time: %s" % time

        Text(
            self.__surface, text_x, top + spacing_y,
            text=hits_text,
            text_font=self.__font,
            text_color=self.__text_color
        ).drawText()
        
        Text(
            self.__surface, text_x, top + int(spacing_y / 2) * 5,
            text=accuracy_text,
            text_font=self.__font,
            text_color=self.__text_color
        ).drawText()
        
        Text(
            self.__surface, text_x, top + int(spacing_y / 2) * 8,
            text=targets_text,
            text_font=self.__font,
            text_color=self.__text_color
        ).drawText()
        
        Text(
            self.__surface, text_x, top + int(spacing_y / 2) * 11,
            text=time_text,
            text_font=self.__font,
            text_color=self.__text_color
        ).drawText()           

        self.__drawBorder()
        
        target_x = left + self.TARGET_RADIUS + spacing_x * 9
        target_y = top + int(self.TARGET_RADIUS / 2) * 3
        target_location = [target_x, target_y]
        
        self.__drawTarget(target_location, shots, self.__target_colors)


    @staticmethod
    def getAccuracy(total_targets, total_hits):
        if total_targets == 0: 
            return 100.0
        elif total_hits == 0: 
            return 0.0
        else: 
            accuracy_percent = 100.0 / total_targets * total_hits
            return accuracy_percent

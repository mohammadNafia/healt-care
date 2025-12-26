from pygame import Surface
from pygame import draw
from pygame import rect

class TargetArea(object):
    LINE_SPACING = 20
    LINE_SIZE = 1
    DEFAULT_COLORS = [(128,128,128),(148,148,148)]

    def __init__(self,surface,x1,y1,x2,y2,target_area_colors=DEFAULT_COLORS):
        if type(surface) is Surface:
            self.__surface = surface
        else: 
            raise TypeError('The argument "surface" must be a Surface object.')  

        self.__geometry = [x1,y1,x2,y2]
        self.__colors = list(target_area_colors)  

        has_one_color = len(self.__colors) == 1
        has_no_colors = len(self.__colors) < 1
        
        if has_one_color:
            self.__colors.append(self.DEFAULT_COLORS[1])
        elif has_no_colors:
            self.__colors = list(self.DEFAULT_COLORS)


    def __drawLines(self,x1,y1,x2,y2):
        line_color = self.__colors[1]
        area_width = x2 - x1
        area_height = y2 - y1
        
        for x in range(x1, x2, self.LINE_SPACING):
            vertical_line = rect.Rect(x, y1, self.LINE_SIZE, area_height)
            draw.rect(self.__surface, line_color, vertical_line)

        for y in range(y1, y2, self.LINE_SPACING):
            horizontal_line = rect.Rect(x1, y, area_width, self.LINE_SIZE)
            draw.rect(self.__surface, line_color, horizontal_line)


    def drawArea(self):
        left = self.__geometry[0]
        top = self.__geometry[1]
        right = self.__geometry[2]
        bottom = self.__geometry[3]
        width = right - left
        height = bottom - top
        
        background_color = self.__colors[0]
        background = rect.Rect(left, top, width, height)
        draw.rect(self.__surface, background_color, background)
        self.__drawLines(left, top, right, bottom)
    

    def getGeometry(self):
        return self.__geometry


    def setGeometry(self,x1,y1,x2,y2):
        self.__geometry = [x1,y1,x2,y2]





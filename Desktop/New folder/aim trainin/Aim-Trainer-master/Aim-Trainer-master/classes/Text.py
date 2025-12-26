from pygame import Surface
from pygame import font

class Text(object):
    DEFAULT_FONT = ('Arial', 30)
    DEFAULT_COLOR = (255,0,0)

    def __init__(self,surface,x,y,text=None,text_font=DEFAULT_FONT,text_color=DEFAULT_COLOR):
        if type(surface) is Surface:
            self.__surface = surface
        else: 
            raise TypeError('The argument "surface" must be a Surface object.') 

        font_name, font_size = text_font
        self.__font = font.SysFont(font_name, font_size)
        self.__surface = surface
        self.__text = text
        self.__color = text_color
        self.__area = [x, y]


    def drawText(self):
        text_surface = self.__font.render(self.__text, False, self.__color)
        self.__surface.blit(text_surface, self.__area)


    def setFont(self,text_font):
        font_name, font_size = text_font
        self.__font = font.SysFont(font_name, font_size)


    def setText(self,text):
        self.__text = text

    


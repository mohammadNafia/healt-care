from pygame import Surface
from pygame import display
from pygame import draw
from pygame import mouse
from random import randint

class Target(object):
    DEFAULT_RADIUS = 50
    DEFAULT_COLORS = [(255,0,0),(255,255,255)]

    __circle = None
    __increased = False
    __maxRadius = None
    __target = []

    def __init__(self,surface,area_geometry=False,radius=DEFAULT_RADIUS,target_colors=DEFAULT_COLORS,location=None):
        if type(surface) is Surface:
            self.__surface = surface
        else: 
            raise TypeError('The argument "surface" must be a Surface object.') 

        self.__surface = surface
        self.__maxRadius = radius

        self.radius = 0
        self.colors = target_colors

        if location is None:
            area_left = area_geometry[0]
            area_top = area_geometry[1]
            area_right = area_geometry[2]
            area_bottom = area_geometry[3]
            
            margin = int(radius / 2 * 3)
            min_x = area_left + margin
            max_x = area_right - margin
            min_y = area_top + margin
            max_y = area_bottom - margin
            
            self.x = randint(min_x, max_x)
            self.y = randint(min_y, max_y)
        else:
            self.x = location[0]
            self.y = location[1]
        self.drawTarget()
        

    def checkHit(self):
        mouse_x, mouse_y = mouse.get_pos()
        
        target_left = self.x - self.radius
        target_right = self.x + self.radius
        target_top = self.y - self.radius
        target_bottom = self.y + self.radius
        
        hit_horizontally = target_left <= mouse_x <= target_right
        hit_vertically = target_top <= mouse_y <= target_bottom
        
        if hit_horizontally and hit_vertically:
            relative_x = mouse_x - (self.x - self.radius)
            relative_y = mouse_y - (self.y - self.radius)

            target_diameter = self.radius * 2
            percent_x = 100.0 / target_diameter * relative_x
            percent_y = 100.0 / target_diameter * relative_y

            return [percent_x, percent_y]
        return False


    def decreases(self,pixel=1):
        self.radius -= pixel


    def drawTarget(self,border=0,border_color=(0,0,0)):
        if self.radius < 0:
            raise ValueError("Radius must be a value >= 0")

        target_center = [self.x, self.y]
        outer_radius = int(self.radius + border)
        inner_radius_80 = int(self.radius * 0.80)
        inner_radius_60 = int(self.radius * 0.60)
        inner_radius_40 = int(self.radius * 0.40)
        
        outer_color = self.colors[0]
        inner_color = self.colors[1]

        draw.circle(self.__surface, border_color, target_center, outer_radius)
        draw.circle(self.__surface, outer_color, target_center, int(self.radius))
        draw.circle(self.__surface, inner_color, target_center, inner_radius_80)
        draw.circle(self.__surface, outer_color, target_center, inner_radius_60)
        draw.circle(self.__surface, inner_color, target_center, inner_radius_40)


    def increase(self,pixel=1):
        reached_max = self.radius >= self.__maxRadius
        already_increased = self.__increased
        
        if reached_max or already_increased:
            self.__increased = True
            return -1

        new_radius = self.radius + pixel
        if new_radius > self.__maxRadius:
            pixel = self.__maxRadius - self.radius
        
        self.radius += pixel



        
        

from classes.App import App
from PIL.ImageColor import getrgb
import json

def setConfig():
    config_filename = "config.json"
    json_indent = 4

    default_config = {
        "Colors":{
            "Final_scoreboard_background_color":App.FINAL_SCOREBOARD_BACKGROUND_COLOR,
            "Scoreboard_color":App.SCOREBOARD_COLOR,
            "Target_colors":App.TARGET_COLORS,
            "Target_area_colors":App.TARGET_AREA_COLORS
            },
        "Extra difficulty settings":{
            "Lives":App.LIVES,
            "Missing_shots_decreases_life":App.MISSING_SHOTS_DECREASES_LIFE,
            },
        "Performance":{
            "Frames_per_second":App.FRAMES_PER_SECOND,
            "Sounds_buffer":App.SOUNDS_BUFFER
            },
        "Targets":{
            "Target_limit_per_second":App.TARGET_LIMIT_PER_SECOND,
            "Target_radius":App.TARGET_RADIUS,
            "Targets_per_second":App.TARGETS_PER_SECOND,
            "Target_speed":App.TARGET_SPEED
        },
    }

    current_config = default_config.copy()

    try:
        config_file = open(config_filename)
        config_data = json.loads(config_file.read())    
        config_file.close()
        
        for category_name in config_data.keys():
            if category_name not in default_config.keys():
                continue

            for setting_name in config_data[category_name].keys():
                if setting_name not in default_config[category_name].keys():
                    continue
                
                if "color" in setting_name.lower():
                    if "colors" in setting_name.lower():
                        converted_colors = []
                        try:
                            for color_value in config_data[category_name][setting_name]:
                                if type(color_value) is str:
                                    color_value = getrgb(color_value)
                                elif type(color_value) in [tuple,list]: 
                                    pass
                                else: 
                                    raise TypeError
                                converted_colors.append(color_value)
                            current_config[category_name][setting_name] = converted_colors.copy()
                        except: 
                            pass
                        continue

                    try:
                        color_value = config_data[category_name][setting_name]
                        if type(color_value) is str:
                            color_value = getrgb(color_value)
                        elif type(color_value) in [tuple,list]: 
                            pass
                        else: 
                            raise TypeError
                        current_config[category_name][setting_name] = color_value
                    except: 
                        continue
                
                current_config[category_name][setting_name] = config_data[category_name][setting_name]
        
        for category_name in current_config.keys():
            for setting_name in current_config[category_name].keys():
                setting_value = current_config[category_name][setting_name]
                setattr(App, setting_name.upper(), setting_value)
                    
    except:
        config_file = open(config_filename, "w")
        config_file.write(json.dumps(default_config, indent=json_indent))
        config_file.close()


if __name__ == "__main__":
    setConfig()
    App().run()

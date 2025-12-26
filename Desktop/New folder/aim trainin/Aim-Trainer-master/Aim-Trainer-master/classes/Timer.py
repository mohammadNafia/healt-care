from time import gmtime,strftime,time

class Timer(object):

    __time = None

    def start(self):
        self.__time = time()
    
    
    def getTime(self,format="%M:%S"):
        return strftime(format,gmtime(time()-self.__time))
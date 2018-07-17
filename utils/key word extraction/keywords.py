from summa.summarizer import summarize
import unicodedata
from os import listdir


def format_text(filename):
    with open(filename) as f:
        s = unicodedata.normalize('NFC', f.read())
        print(s)
    return s

x = listdir("../articles/")
print(x)
#format_text()
#summarize(s)

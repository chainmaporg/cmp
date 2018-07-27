##===========================================================================================================
# 					Rabstar Content Management  
#					Author: George Zhao
#					Created Date: 5/4/2018
#
##===========================================================================================================
import csv
import sys
import json

## Service
## ---------------------------------------------------------------------------------------
class ContentClass:
	key_id=""
	keyword=""


def generateInsStatement(filename):
	l=readFromCsv(filename)
	
	for content in l:
		a="INSERT INTO keywords (category_id, keyword)"
		b="VALUES("
		c=content.key_id+","+"'"+content.keyword
		d="');"
		print(a+b+c+d)


def rr(str):
	return str
	
def readFromCsv(filename):
    with open(filename, mode='r') as csvfile:
        reader = csv.reader(csvfile, quotechar='"', delimiter=',',quoting=csv.QUOTE_ALL, skipinitialspace=True)
        contentList = []
        for row in reader:
            if(row[0]):
                content=ContentClass()
                content.key_id=rr(row[0])
                content.keyword=rr(row[1])
                contentList.append(content)
        return contentList
 
generateInsStatement('keywords.csv')
 
    
    

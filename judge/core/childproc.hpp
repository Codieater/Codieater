#ifndef __CHLIDPROC_H_
#define __CHILDPROC_H_

#include <unistd.h> 
#include <string> 
#include <vector> 
#include <cstring> 
#include <signal.h> 
#include <sys/resource.h>
#include <sys/time.h>
#include "Seccomp.hpp"
#include "../system/config.hpp"
#include "../system/error.hpp"

using namespace std; 


/* == wrapper to system function of C ==  
    here are 2 types of system functions 
    (1) for resource limit, and monitering 
    (2) control child process like execve and kill  
*/


bool setLimitFd(int maxFd);

bool setLimitProcCount(int maxProc); 

bool setLimitMemory(int maxMemory); 

bool setLimitHeapMemory(int maxMemory); 

bool setLimitStackMemory(int maxMomory); 

bool setLimitTime(int maxTime, int targetPid); 

bool removeLimitTime(); 

bool startMeasureTime(); 

int endMeasureTime(); 

bool redirectFd(int sourceFd, int destFd, bool closeSrcFd);

int getUsedMemory(struct rusage& resource);

int getUsedCPUTime(struct rusage& resource);
/*  
    startChildProc  : Wrapper class of execv , start child process in specific paht and args

    path : change dir 
    cmd  : command want to be execute 
    args : argument to pass in string array 
    env  : envirnoment varible to set in child process
*/
int startChildProc(string path, string cmd, vector<string> args, vector<string> env, Seccomp* sec = nullptr); 

#endif

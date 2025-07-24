Fjell Logging is just another logging library and it's designed to as straightforward as possible.

## Why another logging library?

The original author was getting really tired of the existing logging libraries and the level of complexity they added to the codebase.

## How do I install it?

`yarn add @fjell/logging`

Then create an environment variable called `LOGGING_CONFIG` and configure it as follows:

````
LOGGING_CONFIG=`
{
    "logLevel": "DEFAULT",
    "logFormat": "TEXT",
    "overrides": {
        "@myproject/core": { "logLevel": "INFO" },
        "@myproject/wagner-lib": { "logLevel": "DEBUG" },
        "@myproject/express-router": { "logLevel": "DEFAULT" },
    }
}
````

In your code, you can use it like this, note that I'm assuming you have a project called `@myproject/core`.   Create a logger.js file in the root of your project, and are the following code:

````
import Logging from "@fjell/logging";

const LibLogger = Logging.getLogger("@myproject/core");

export default LibLogger;
````

Then in another file, import the LibLogger and get an instance of a logger from it:

````
import LibLogger from "./logger.js";

const logger = LibLogger.get("my-component");

logger.info("Hello, world!");
````

This would generate a log message that prints out `[INFO] - [@myproject/core] [my-component] Hello, world!`.

Note that you can pass as many components as you want to the `get` method.  The components are just used to create a category for the log message.  It's a way to group related logs together.  For example:

````
const logger = LibLogger.get("my-component", "my-sub-component");

logger.info("Hello, world!");
````

This would generate a log message that prints out `[INFO] - [@myproject/core] [my-component] [my-sub-component] Hello, world!`.

## What methods are available on `logger`?

* emergency (highest priority)
* alert
* critical
* error
* warning
* notice
* info
* debug
* DEFAULT (lowest priority)

Every instance of logger also has two methods that return new instance of logger:

* time(message: string, ...data: any[]) => TimeLogger
* get(...components: string[]) => Logger

The `TimeLogger` has two methods, and is used to time the execution of a block of code.

* end() => void
* log(...data: any[]) => void

## What were the overrides in that `LOGGING_CONFIG` environment variable?

The overrides are used to set the log level for a specific project or component.  For example, if you have a project called `@myproject/core` and you want to set the log level to `INFO`, you can do the following:

````
LOGGING_CONFIG=`
{
    "logLevel": "DEFAULT",
    "logFormat": "TEXT",
    "overrides": {
        "@myproject/core": { "logLevel": "INFO" },
        "@myproject/wagner-lib": { "logLevel": "DEBUG" },
        "@myproject/express-router": { "logLevel": "DEFAULT" },
    }
}
````

## Wait, what if I don't use yarn?  How do I install it then?

You have a lot of question, don't you? We think the answer is `npm install @fjell/logging`, but we're not sure because we (the project) use yarn.

Please, calm down about that last sentence.  You don't need to write a complainy post about it.Don't read that last statement as some sort of endorsement of yarn or a recommendation, it's just a fact about this project.  If you want to add more helpful information for people using npm, go ahead and submit a pull request.

## Where do I create that environment variable?

We can't answer that for you, but it also is the kind of question that would be asked by someone who might not be ready to use this library.  If you're ready to use it, you'll know where to put the environment variable.   Some examples, if you are running a node application, you might put it in a `.env` file and use the dotenv library.  If you are running an application something like Google Cloud Run, you'll configure this as an environment variable.   If you don't know what these mean, go look it up.

## What are the valid values for `logLevel`?

Set the log level to one of the following values sorted from highest priority to lowest priority.   when you define the `logLevel` in the `LOGGING_CONFIG` environment variable, you are defining the lowest priority of messages to include in the generated logs.

* EMERGENCY (highest priority)
* ALERT
* CRITICAL
* ERROR
* WARNING
* NOTICE
* INFO
* DEBUG
* DEFAULT (lowest priority)

Note that these log levels are going to correlate to the log levels currently available on Google Cloud Observability.  Again, don't that this as a recommendation to use Google Cloud, the use of this list was a pragmatic choice to ensure that this library had enoguh levels to match GCP.

### Are log levels configurable?

Not at the moment, but you are welcome to fork this repository and make a pull a request if that's something you need.

## What are the valid values for `logFormat`?

Set the log format to one of the following values.

* TEXT
* STRUCTURED

`TEXT` is the default log format and it's a simple text format.

`STRUCTURED` is a structured format that's designed to be consumed by Google Cloud Observability.

### Are log formats configurable?

No, but, again, you are welcome to fork this repository and make a pull a request if that's something you need.

## How does it compare to other logging libraries?

Not sure, why don't you go and use another logging library? The authors of this library don't really care to compete or compare what they are doing with another logging library. If you are trying to capture logs, maybe this library is for you. That's a decision you need to make.

This answer isn't trying to be 'flippant' or 'sarcastic'. It's just that the project isn't here to compete.  In fact, other logging libraries are probably much more capable. Go use them.

## How do I participate in this project?

You can participate in this project by forking the repository and making a pull request.  You can also participate by reporting issues or suggesting features.  If you have a question, go ahead and ask it on the issue tracker.  The project that published this isn't particularly active, but we'll try to respond to issues and pull requests.

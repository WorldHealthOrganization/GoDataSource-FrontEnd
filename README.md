# Go.Data - Front End application

This project uses Angular cli version 14.2.12 and Angular v14.3.0.

## Installation (Development Environment)

### Pre-Requisites

Install Node.js v16.18.1 and compatible npm on your machine (https://nodejs.org/download/).

Install git on your machine
- For Ubuntu:

   ```
   sudo apt-get update
   sudo apt-get install git
   ```

### Installation steps

Get the code from GitHub

    git clone https://bitbucket.org/clarisoft-technologies/go.data-front-end.git

Install 3rd-party packages

    npm install

### Running with dev environment

Configure the application for dev environment

    cp src/environments/environment.ts.default src/environments/environment.ts

Update src/environments/environment.ts as necessary

Run the application (it will start on port 4550; you can change this from the package.json file)

    npm start

Open your browser on: http://localhost:4550

### Running with production environment

Configure the application for production environment

    cp src/environments/environment.ts.default src/environments/environment.prod.ts

Update src/environments/environment.prod.ts as necessary

Create the production build

    npm run build

This build will be served by the API. Check API documentation to get the path where the frontend build should be placed.

## Development

Use the IDE of your choice (Webstorm recommended).

### Development cycle

1. Nobody can directly PUSH into master
2. Every code change will be done in a separate branch and a Pull Request (PR) will be created for merging the code into master
- Create a new branch from latest version of master. Use the Jira activity ID for branch name (e.g. "```385484```")
- Push the changes into the branch daily
- When the work is ready to be merged in master create a Pull Request (PR) from your branch
  - The PR title must contain the Jira activity ID and title (e.g. "```385484: Research & Preparing the project```")
  - The PR description must include a summary of the changes, the affected areas and other additional noted if necessary
3. Every PR needs to be reviewed by another dev in order to be merged in master
- Review comments are added inline, on PR's page in GitHub UI
- If the changes are good to be merged in master, the Reviewer will Approve the PR and then merge it in master
- If the PR requires any changes, the Reviewer will add the comments and will inform the dev when the code review is finished
  - Dev must address all the comments in his PR, fix the code where necessary and REPLY to all comments, so the Reviewer knows that none of the comments were missed
4. Before assigning the ticket to QA, the developer must close the branch(es) that were merged and are not needed anymore.

### Managing Language Translations

1. Go.Data supports multiple languages, the base language being English-US.
2. In development, we are adding support only for the English-US language.
3. We must NOT have hardcoded strings in our application. All the strings that are being displayed in the UI must be translated.
4. All the translations (aka Language Tokens) are stored in the API
5. For development purpose only, FrontEnd developers can add new Language Tokens in "**/src/app/i18n/english_us.ts**" file, so that the changes are reflected in the UI while developing.
- Note that the Language Tokens in previously mentioned file (english_us.ts) are overriding the values defined in the API.
6. From time to time / before release, we are cleaning up the "english_us.ts" file, moving all the tokens in the API code.
7. **Before defining new Language Tokens in "english_us.ts" file, verify that there isn't already existing a similar token in the API language file (see item #4 from above), and that you are following the pattern.**.
- Note that all the Language Tokens are grouped based on some criteria (scope, page).
8. If you want to remove a Language Token that is not being used (anymore), just add a comment in "english_us.ts" and it will be taken into account when merging the file with the API translations (see item #6 from above).


<br>


# Terms of Use

Please read these Terms of Use and Software License Agreement (the “**Agreement**”) carefully before installing the Go.Data Software (the “**Software**”).

By installing and/or using the Software, you (the “**Licensee**”) accept all terms, conditions, and requirements of the Agreement. 

## 1. Components of the Software

The Software is a product published by WHO (the “**Software**”) and enables you to input, upload and view your data (the “**Data**”). 

This Agreement governs your use of the Software you have downloaded.


## 2. Third-party software

#### 2.1. Third-party software embedded in the Software.

The Software contains third party open source software components, issued under various open source licenses:

- 0BSD
- AFL-2.1
- BSD-3-Clause
- BSD-2-Clause
- BSD-3-Clause-Clear
- Apache-2.0
- MIT
- MIT-0
- MPL-2.0
- CC-BY-3.0
- CC-BY-4.0
- CC0-1.0
- ISC
- Unlicense
- WTFPL
- AGPL-3.0
- Python-2.0
- BlueOak-1.0.0
- Artistic-2.0
- Zlib
- Ruby

The text of the respective licenses can be found in Annex 2.

#### 2.2. WHO disclaimers for third-party software.

WHO makes no warranties whatsoever, and specifically disclaims any and all warranties, express or implied, that either of the third-party components are free of defects, virus free, able to operate on an uninterrupted basis, merchantable, fit for a particular purpose, accurate, non-infringing or appropriate for your technical system.

#### 2.3. No WHO endorsement of third-party software.

The use of the third-party Components or other third-party software does not imply that these products are endorsed or recommended by WHO in preference to others of a similar nature.

## 3. License and Terms of Use for the Software 

#### Copyright and license. 

The Software is copyright (©) World Health Organization, 2018, and is distributed under the terms of the GNU General Public License version 3 (GPL-3.0). The full license text of the GNU GPL-3.0 can be found below in Annex 1.

## 4. Copyright, Disclaimer and Terms of Use for the Maps 

#### 4.1. 

The boundaries and names shown and the designations used on the maps [embedded in the Software] (the “**Maps**”) do not imply the expression of any opinion whatsoever on the part of WHO concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Dotted and dashed lines on maps represent approximate border lines for which there may not yet be full agreement. 

#### 4.2. 

Unlike the Software, WHO is not publishing the Maps under the terms of the GNU GPL-3.0. The Maps are not based on “R”, they are an independent and separate work from the Software, and not intended to be distributed as “part of a whole” with the Software.

## 5. Acknowledgment and Use of WHO Name and Emblem

You shall not state or imply that results from the Software are WHO’s products, opinion, or statements. Further, you shall not (i) in connection with your use of the Software, state or imply that WHO endorses or is affiliated with you or your use of the Software, the Software, the Maps, or that WHO endorses any entity, organization, company, or product, or (ii) use the name or emblem of WHO in any way. All requests to use the WHO name and/or emblem require advance written approval of WHO.

## 6. Dispute Resolution

Any matter relating to the interpretation or application of this Agreement which is not covered by its terms shall be resolved by reference to Swiss law. Any dispute relating to the interpretation or application of this Agreement shall, unless amicably settled, be subject to conciliation. In the event of failure of the latter, the dispute shall be settled by arbitration. The arbitration shall be conducted in accordance with the modalities to be agreed upon by the parties or, in the absence of agreement, in accordance with the UNCITRAL Arbitration Rules. The parties shall accept the arbitral award as final.

## 7. Privileges and Immunities of WHO

Nothing contained herein or in any license or terms of use related to the subject matter herein (including, without limitation, the GNU General Public License version 3 mentioned in paragraph 3.1 above) shall be construed as a waiver of any of the privileges and immunities enjoyed by the World Health Organization under national or international law, and/or as submitting the World Health Organization to any national jurisdiction.

Annex 1

- [GNU General Public License Version 3, 29 June 2007](LICENSE)

Annex 2

- [0BSD](https://opensource.org/license/0bsd)
- [AFL-2.1](https://spdx.org/licenses/AFL-2.1.html)
- [BSD-3-Clause](https://opensource.org/license/bsd-3-clause)
- [BSD-2-Clause](https://opensource.org/license/bsd-2-clause)
- [BSD-3-Clause-Clear](https://spdx.org/licenses/BSD-3-Clause-Clear.html)
- [Apache-2.0](https://opensource.org/license/apache-2-0)
- [MIT](https://opensource.org/license/mit)
- [MIT-0](https://opensource.org/license/mit-0)
- [MPL-2.0](https://opensource.org/license/mpl-2-0)
- [CC-BY-3.0](https://creativecommons.org/licenses/by/3.0/legalcode.en)
- [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode.en)
- [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en)
- [ISC](https://opensource.org/license/isc-license-txt)
- [Unlicense](https://opensource.org/license/unlicense)
- [WTFPL](http://www.wtfpl.net/about/)
- [AGPL-3.0](https://opensource.org/license/agpl-v3)
- [Python-2.0](https://www.python.org/download/releases/2.0/)
- [BlueOak-1.0.0](https://opensource.org/license/blue-oak-model-license)
- [Artistic-2.0](https://opensource.org/license/artistic-2-0)
- [Zlib](https://opensource.org/license/zlib)
- [Ruby](https://spdx.org/licenses/Ruby.html)


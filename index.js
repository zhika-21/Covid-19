'use strict';

// SECTION Global variables

let countries = [];
let countriesListArr = [];
let userDefinedNumberFormat;

// SECTION Classes

class CountryCard {
  constructor(
    countryName,
    infectConfirmed,
    infectRecovered,
    infectDeaths,
    infectPopulation,
    vaccAdministered,
    vaccPartially,
    vaccFully
  ) {
    this.countryName = countryName;
    this.infectConfirmed = infectConfirmed;
    this.infectRecovered = infectRecovered;
    this.infectDeaths = infectDeaths;
    this.infectPopulation = infectPopulation;
    this.vaccAdministered = vaccAdministered;
    this.vaccPartially = vaccPartially;
    this.vaccFully = vaccFully;
  }

  getComparisonConfirmed(referenceObject) {
    return (
      (this.infectConfirmed / this.infectPopulation -
        referenceObject.infectConfirmed / referenceObject.infectPopulation) *
      100
    ).toFixed(2);
  }
  getComparisonRecovered(referenceObject) {
    return (
      (this.infectRecovered / this.infectConfirmed -
        referenceObject.infectRecovered / referenceObject.infectConfirmed) *
      100
    ).toFixed(2);
  }
  getComparisonDeaths(referenceObject) {
    return (
      (this.infectDeaths / this.infectConfirmed -
        referenceObject.infectDeaths / referenceObject.infectConfirmed) *
      100
    ).toFixed(2);
  }
  getComparisonVaccinations(referenceObject) {
    return (
      (this.vaccAdministered / this.infectPopulation -
        referenceObject.vaccAdministered / referenceObject.infectPopulation) *
      100
    ).toFixed(2);
  }
}

// SECTION Functions

const toggleSpinner = function (typeOfSearch, toggle) {
  removeOldMessage();
  const spinner = document.querySelector('.spinner');
  const spinnerLegend = document.querySelector('.spinner-legend');
  if (toggle === 'on') {
    spinner.setAttribute('style', 'opacity: 1;');
    spinnerLegend.textContent = `Searching for ${typeOfSearch}`;
  }
  if (toggle === 'off') {
    spinner.setAttribute('style', 'opacity: 0;');
    spinnerLegend.textContent = '';
  }
};

const successCheck = function () {
  const greenCheck = document.createElement('div');
  greenCheck.innerHTML = `<div class="green-check"><img src="./img/checked.png"></div>`;
  document
    .querySelector('.spinner')
    .insertAdjacentElement('afterend', greenCheck);
  setTimeout(() => {
    document.querySelector('.green-check').remove();
  }, 3000); // Must be in sync with fadeInAndOut CSS animation
};

function getUserCoords(pos) {
  const crd = pos.coords;
  getCountryName(crd.latitude, crd.longitude);
}

function getUserCoordsError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      displayErrorMessage(
        'automatic geolocation',
        new Error('User denied the request for Geolocation')
      );
      break;
    case error.POSITION_UNAVAILABLE:
      displayErrorMessage(
        'automatic geolocation',
        new Error('Location information is unavailable')
      );
      break;
    case error.TIMEOUT:
      displayErrorMessage(
        'automatic geolocation',
        new Error('The request to get user location timed out')
      );
      break;
    case error.UNKNOWN_ERROR:
      displayErrorMessage(
        'automatic geolocation',
        new Error('An unknown error occurred')
      );
      break;
  }
  toggleSpinner('user location', 'off');
  // Allow user to enter a country on search box input
  lockCountrySearch('off');
}

const getCountryName = async function (lat, lng) {
  try {
    // Get country (reverse geocoding)
    toggleSpinner('country', 'on');
    const data = await fetch(`https://geocode.xyz/${lat},${lng}?geoit=json`)
      .then((res) => res.json())
      .then((data) => data);
    const userCountry = data.country;
    toggleSpinner('country', 'off');

    // Handling possible error
    if (userCountry === undefined) {
      displayErrorMessage(
        'getting country name',
        new Error(
          'Communication with geocode.xyz API failed. Please reload the page and try again.'
        )
      );
    } else {
      // Display country card
      await buildCountryCard(userCountry);
      document.querySelector('#search-bar__input__countryToSearch').value = '';
    }
    // Allow user to enter a country on search box input
    lockCountrySearch('off');
  } catch (err) {
    // displayErrorMessage('getting country name', new Error(err));
    displayErrorMessage(
      'getting country name',
      new Error(
        'Communication with geocode.xyz API failed. Please reload the page and try again.'
      )
    );
    // Allow user to enter a country on search box input
    lockCountrySearch('off');
  }
};

const getCountryFlag = async function (countryName) {
  try {
    const flag = await fetch(
      `https://restcountries.com/v3.1/name/${countryName}`
    )
      .then((res) => res.json())
      .then((data) => data[0].flags.png);
    return flag;
  } catch (err) {
    displayErrorMessage('calling API to get country flag', new Error(err));
  }
};

const removeOldMessage = function () {
  // Remove possible old message
  const oldSuccessMessage = document.querySelector('.message-success');
  const oldErrorMessage = document.querySelector('.message-error');
  if (oldSuccessMessage) {
    oldSuccessMessage.remove();
  }
  if (oldErrorMessage) {
    oldErrorMessage.remove();
  }
};

const displayComparisonSuccessfullyUpdatedMessage = function () {
  removeOldMessage();
  // Show new message
  if (countries.length > 0) {
    const comparisonSuccessfullyUpdated = `
        <div class="message-success-container">
        <div class="message-success">
        <p>${
          countries.length > 1 ? `Comparison data updated. ` : ``
        }New reference country is ${countries[0].countryName}.</p>
        <div class="close-message-btn">
        <img src="./img/delete.png" alt="Close card icon" width="0.625rem" height="0.625rem" id="success-message-close-btn"/>
        </div>
        </div>
        </div>
        `;
    document
      .querySelector('.countries-container')
      .insertAdjacentHTML('beforebegin', comparisonSuccessfullyUpdated);
    // Delete button event listener
    document
      .querySelector('.close-message-btn')
      .addEventListener('click', () =>
        document.querySelector('.message-success').remove()
      );
  }
};

const displayErrorMessage = function (errorType, errorMessage) {
  removeOldMessage();
  // Show new message
  const errorMessageToDisplay = `
        <div class="message-error-container">
            <div class="message-error">
                <p>Error in ${errorType} (${errorMessage.message}).</p>
                <div class="close-message-btn">
                    <img src="./img/delete.png" alt="Close card icon" width="0.625rem" height="0.625rem" id="error-message-close-btn"/>
                </div>
            </div>
        </div>
        `;
  document
    .querySelector('.countries-container')
    .insertAdjacentHTML('beforebegin', errorMessageToDisplay);
  // Delete button event listener
  document
    .querySelector('.close-message-btn')
    .addEventListener('click', () =>
      document.querySelector('.message-error').remove()
    );
};

const recalculateComparisons = function () {
  const countryCards = document.querySelectorAll(
    '.full-country-data-container'
  );
  countryCards.forEach((card, i) => {
    const comparisonContainer = card.lastElementChild;
    if (i === 0) {
      // Render "Reference country" for first country card and remove comparison data
      const comparisonHTML = `
                <aside class="country__comparison__list-container">
                    <div class="country__comparison__title reference-country">
                        <h3>Reference country</h3>
                    </div>
                </aside>
            `;
      comparisonContainer.insertAdjacentHTML('afterend', comparisonHTML);
      comparisonContainer.remove();
    } else {
      // Recalculate and render other country cards comparison data
      const comparisonConfirmed = countries[i].getComparisonConfirmed(
        countries[0]
      );
      const comparisonRecovered = countries[i].getComparisonRecovered(
        countries[0]
      );
      const comparisonDeaths = countries[i].getComparisonDeaths(countries[0]);
      const comparisonVaccinations = countries[i].getComparisonVaccinations(
        countries[0]
      );

      const comparisonContainerUpdated = `
                <aside class="country__comparison__list-container">
                    <div class="country__comparison__title">
                        <h3>Comparison with first country</h3>
                    </div>
                    <ul>
                        <li class="country__comparison__list__item">
                            <div class="country__comparison__list__item__reference">Confirmed</div>
                            <div class="country__comparison__list__item__value">${
                              !isFinite(comparisonConfirmed)
                                ? 'no data'
                                : (comparisonConfirmed < 0 ? '' : '+') +
                                  userDefinedNumberFormat.format(
                                    comparisonConfirmed
                                  ) +
                                  '%'
                            }<img src="./img/information.png" class="calculations-information__info-icon"></div>
                        </li>
                        <li class="country__comparison__list__item">
                            <div class="country__comparison__list__item__reference">Recovered</div>
                            <div class="country__comparison__list__item__value">${
                              !isFinite(comparisonRecovered)
                                ? 'no data'
                                : (comparisonRecovered < 0 ? '' : '+') +
                                  userDefinedNumberFormat.format(
                                    comparisonRecovered
                                  ) +
                                  '%'
                            }<img src="./img/information.png" class="calculations-information__info-icon"></div>
                        </li>
                        <li class="country__comparison__list__item">
                            <div class="country__comparison__list__item__reference">Deaths</div>
                            <div class="country__comparison__list__item__value">${
                              !isFinite(comparisonDeaths)
                                ? 'no data'
                                : (comparisonDeaths < 0 ? '' : '+') +
                                  userDefinedNumberFormat.format(
                                    comparisonDeaths
                                  ) +
                                  '%'
                            }<img src="./img/information.png" class="calculations-information__info-icon"></div>
                        </li>
                        <li class="country__comparison__list__item">
                            <div class="country__comparison__list__item__reference">Vaccinations</div>
                            <div class="country__comparison__list__item__value">${
                              !isFinite(comparisonVaccinations)
                                ? 'no data'
                                : (comparisonVaccinations < 0 ? '' : '+') +
                                  userDefinedNumberFormat.format(
                                    comparisonVaccinations
                                  ) +
                                  '%'
                            }<img src="./img/information.png" class="calculations-information__info-icon"></div>
                        </li>
                    </ul>
                    </aside>
                    `;
      // Render updated container
      comparisonContainer.insertAdjacentHTML(
        'afterend',
        comparisonContainerUpdated
      );
      // Delete old container
      comparisonContainer.remove();

      showCalculationInformation(countries[i].countryName);
    }
  });
  // Display message about updated data
  displayComparisonSuccessfullyUpdatedMessage();
};

const addEventListenerToCardDeleteButton = function (countryInfo) {
  // Delete card
  const deleteButtons = document.querySelectorAll('.close-card-btn');
  // Newly added country
  deleteButtons[deleteButtons.length - 1].addEventListener('click', () => {
    const countryCards = document.querySelectorAll(
      '.full-country-data-container'
    );
    // Delete array element
    countries.forEach((element) => {
      if (element.countryName === countryInfo.countryName) {
        countries.splice(countries.indexOf(element), 1);
      }
    });
    // Delete card HTML
    countryCards.forEach((card, i) => {
      if (card.dataset.id === countryInfo.countryName) {
        card.remove();
        // Recalculate if deleted country is the first one
        if (i === 0) {
          recalculateComparisons();
        }
        if (countryCards.length <= 1) {
          hideResetButton();
        }
      }
    });
    lockCountrySearch();
    if (countries.length === 0) {
      // Show 'Add my current country' button
      document
        .querySelector('.add-current-country-btn')
        .classList.remove('hidden');
    }
  });
};

const lockCountrySearch = function (toggleLock = 'off', country = '') {
  // Prevent further countries from being added (4 countries maximum)
  const searchButton = document.querySelector('.search-bar__btn');
  const inputField = document.getElementById(
    'search-bar__input__countryToSearch'
  );
  if (toggleLock === 'on' || countries.length >= 4) {
    inputField.disabled = true;
    toggleLock === 'off'
      ? (inputField.value = 'Country limit reached')
      : (inputField.value = 'Fetching country...');
    searchButton.classList.add('hidden');
    return;
  }
  if (toggleLock === 'off') {
    inputField.disabled = false;
    inputField.value = country;
    searchButton.classList.remove('hidden');
  }
};

const displayCountryCard = async function (countryInfo) {
  let countryCardHTMLStructure;
  let comparisonHTML;

  if (countries.length > 1) {
    const comparisonConfirmed = countryInfo.getComparisonConfirmed(
      countries[0]
    );
    const comparisonRecovered = countryInfo.getComparisonRecovered(
      countries[0]
    );
    const comparisonDeaths = countryInfo.getComparisonDeaths(countries[0]);
    const comparisonVaccinations = countryInfo.getComparisonVaccinations(
      countries[0]
    );

    comparisonHTML = `
            <aside class="country__comparison__list-container">
                <div class="country__comparison__title">
                    <h3>Comparison with first country</h3>
                </div>
                <ul>
                    <li class="country__comparison__list__item">
                        <div class="country__comparison__list__item__reference">Confirmed</div>
                        <div class="country__comparison__list__item__value">${
                          !isFinite(comparisonConfirmed)
                            ? 'no data'
                            : (comparisonConfirmed < 0 ? '' : '+') +
                              userDefinedNumberFormat.format(
                                comparisonConfirmed
                              ) +
                              '%'
                        }<img src="./img/information.png" class="calculations-information__info-icon"></div>
                    </li>
                    <li class="country__comparison__list__item">
                        <div class="country__comparison__list__item__reference">Recovered</div>
                        <div class="country__comparison__list__item__value">${
                          !isFinite(comparisonRecovered)
                            ? 'no data'
                            : (comparisonRecovered < 0 ? '' : '+') +
                              userDefinedNumberFormat.format(
                                comparisonRecovered
                              ) +
                              '%'
                        }<img src="./img/information.png" class="calculations-information__info-icon"></div>
                    </li>
                    <li class="country__comparison__list__item">
                        <div class="country__comparison__list__item__reference">Deaths</div>
                        <div class="country__comparison__list__item__value">${
                          !isFinite(comparisonDeaths)
                            ? 'no data'
                            : (comparisonDeaths < 0 ? '' : '+') +
                              userDefinedNumberFormat.format(comparisonDeaths) +
                              '%'
                        }<img src="./img/information.png" class="calculations-information__info-icon"></div>
                    </li>
                    <li class="country__comparison__list__item">
                        <div class="country__comparison__list__item__reference">Vaccinations</div>
                        <div class="country__comparison__list__item__value">${
                          !isFinite(comparisonVaccinations)
                            ? 'no data'
                            : (comparisonVaccinations < 0 ? '' : '+') +
                              userDefinedNumberFormat.format(
                                comparisonVaccinations
                              ) +
                              '%'
                        }<img src="./img/information.png" class="calculations-information__info-icon"></div>
                    </li>
                </ul>
            </aside>
            
            </article>
        `;
  }
  if (countries.length <= 1) {
    // Render "Reference country" for first country card
    comparisonHTML = `
            <aside class="country__comparison__list-container">
                <div class="country__comparison__title reference-country">
                    <h3>Reference country</h3>
                </div>
            </aside>
            
            </article>
        `;
  }

  countryCardHTMLStructure = `
        <article class="full-country-data-container" data-id="${
          countryInfo.countryName === undefined
            ? 'Name-not-found'
            : countryInfo.countryName
        }">
        <main class="country-container">
            <div class="close-card-btn">
                <img src="./img/delete.png" alt="Close card icon" width="16px" height="16px"/>
            </div>
            <div class="country__flag-container">
                <div class="country__flag__flag-empty"></div>
                    <div class="country__flag__title__container">
                    <div class="country__flag__title">${
                      countryInfo.countryName === undefined
                        ? 'Name not found'
                        : countryInfo.countryName
                    }</div>
                </div>
            </div>
            <div class="country__infections-container">
                <div class="country__infections__title">
                    <h3>COVID-19 infections</h3>
                </div>
                <div class="country__infections__list-container">
                    <ul>
                        <li class="country__infections__list__item">
                            <div class="country__infections__list__item__reference">Confirmed</div>
                            <div class="country__infections__list__item__value">${
                              !isFinite(countryInfo.infectConfirmed)
                                ? 'no data'
                                : userDefinedNumberFormat.format(
                                    countryInfo.infectConfirmed
                                  )
                            }</div>
                        </li >
                        <li class="country__infections__list__item">
                            <div class="country__infections__list__item__reference">Recovered</div>
                            <div class="country__infections__list__item__value">${
                              !isFinite(countryInfo.infectRecovered)
                                ? 'no data'
                                : userDefinedNumberFormat.format(
                                    countryInfo.infectRecovered
                                  )
                            }</div>
                        </li>
                        <li class="country__infections__list__item">
                            <div class="country__infections__list__item__reference">Deaths</div>
                            <div class="country__infections__list__item__value">${
                              !isFinite(countryInfo.infectDeaths)
                                ? 'no data'
                                : userDefinedNumberFormat.format(
                                    countryInfo.infectDeaths
                                  )
                            }</div>
                        </li>
                        <li class="country__infections__list__item">
                            <div class="country__infections__list__item__reference">Population</div>
                            <div class="country__infections__list__item__value">${
                              !isFinite(countryInfo.infectPopulation)
                                ? 'no data'
                                : userDefinedNumberFormat.format(
                                    countryInfo.infectPopulation
                                  )
                            }</div>
                        </li>
                    </ul>
                </div>
            </div>
                <div class="country__vaccinations-container">
                    <div class="country__vaccinations__title">
                        <h3>COVID-19 vaccinations</h3>
                    </div>
                    <div class="country__vaccinations__list-container">
                        <ul>
                            <li class="country__vaccinations__list__item">
                                <div class="country__vaccinations__list__item__reference">Administered</div>
                                <div class="country__vaccinations__list__item__value">${
                                  !isFinite(countryInfo.vaccAdministered)
                                    ? 'no data'
                                    : userDefinedNumberFormat.format(
                                        countryInfo.vaccAdministered
                                      )
                                }</div>
                            </li>
                            <li class="country__vaccinations__list__item">
                                <div class="country__vaccinations__list__item__reference">Partially Vacc.</div>
                                <div class="country__vaccinations__list__item__value">${
                                  !isFinite(countryInfo.vaccPartially)
                                    ? 'no data'
                                    : userDefinedNumberFormat.format(
                                        countryInfo.vaccPartially
                                      )
                                }</div>
                            </li>
                            <li class="country__vaccinations__list__item">
                                <div class="country__vaccinations__list__item__reference">Fully Vacc.</div>
                                <div class="country__vaccinations__list__item__value">${
                                  !isFinite(countryInfo.vaccFully)
                                    ? 'no data'
                                    : userDefinedNumberFormat.format(
                                        countryInfo.vaccFully
                                      )
                                }</div>
                            </li>
                        </ul>
                    </div>
                </div>
        </main >
    `;

  countryCardHTMLStructure += comparisonHTML;
  document
    .querySelector('.countries-container')
    .insertAdjacentHTML('beforeend', countryCardHTMLStructure);

  try {
    const flagContainers = document.querySelectorAll(
      '.country__flag-container'
    );
    const countryFlag = await getCountryFlag(countryInfo.countryName);
    console.log(countryFlag);
    flagContainers[
      flagContainers.length - 1
    ].style.backgroundImage = `url(${countryFlag})`;
  } catch (err) {
    displayErrorMessage('getting country flag', new Error(err));
  }
  addEventListenerToCardDeleteButton(countryInfo);
  lockCountrySearch();
};

const hideResetButton = function () {
  document.querySelector('.reset-btn').classList.add('hidden');
};

const displayResetButton = function () {
  document.querySelector('.reset-btn').classList.remove('hidden');
};

const showCalculationInformation = function (country) {
  if (countries.length < 2) return;
  // Calculations information
  const countryCards = document.querySelectorAll(
    '.full-country-data-container'
  );
  countryCards.forEach((card, i) => {
    if (card.dataset.id === country) {
      const liElements = document.querySelectorAll(
        '.full-country-data-container'
      )[i].children[1].children[1].children;
      for (const [j, liItem] of Object.entries(liElements)) {
        let infoIcon = liItem.children[1].lastChild;
        const infoMessage = document.querySelector(
          `.calculations-information__${j}`
        );
        infoIcon.addEventListener('mouseenter', (e) => {
          infoMessage.style.top = `${e.clientY - 4 * 16 + window.scrollY}px`; // 16px = 1rem
          infoMessage.style.left = `${e.clientX - 14 * 16 + window.scrollX}px`; // 16px = 1rem
          infoMessage.classList.remove('hidden');
        });
        infoIcon.addEventListener('mouseleave', () => {
          infoMessage.classList.add('hidden');
        });
      }
    }
  });
};

const buildCountryCard = async function (country) {
  try {
    const countryInfo = new CountryCard(...(await getCovid19Data(country)));
    lockCountrySearch('off');
    countries.push(countryInfo);
    displayCountryCard(countryInfo);
    showCalculationInformation(country);
    displayResetButton();
  } catch (err) {
    displayErrorMessage(
      'getting COVID-19 data to build country statistics',
      new Error(err)
    );
  }
  // Hide 'Add my current country' button
  document.querySelector('.add-current-country-btn').classList.add('hidden');
};

const getCovid19Data = async function (country) {
  // Get COVID-19 API data (https://github.com/M-Media-Group/Covid-19-API)
  let countryCOVID19Data = [];
  toggleSpinner('COVID-19 data', 'on');
  try {
    const covid19CurrentData = await fetch(
      `https://covid-api.mmediagroup.fr/v1/cases?country=${country}`
    )
      .then((res) => res.json())
      .then((data) => {
        countryCOVID19Data.push(
          data.All.country,
          data.All.confirmed,
          data.All.recovered,
          data.All.deaths,
          data.All.population
        );
      });
  } catch (err) {
    displayErrorMessage(
      'getting COVID-19 data to build country statistics',
      new Error('The country you entered has no COVID-19 data')
    );
  }
  try {
    const covid19VaccinesData = await fetch(
      `https://covid-api.mmediagroup.fr/v1/vaccines?country=${country}`
    )
      .then((res) => res.json())
      .then((data) => {
        countryCOVID19Data.push(
          data.All.administered,
          data.All.people_partially_vaccinated,
          data.All.people_vaccinated
        );
      });
  } catch (err) {
    displayErrorMessage(
      'getting COVID-19 data to build country statistics',
      new Error('The country you entered has no COVID-19 vaccination data')
    );
  }
  toggleSpinner('COVID-19 data', 'off');
  successCheck();
  return countryCOVID19Data;
};

// SECTION Countries autocomplete (adapted from https://www.w3schools.com/howto/howto_js_autocomplete.asp)

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
  let currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener('input', function (e) {
    let a,
      b,
      i,
      val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) {
      return false;
    }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement('DIV');
    a.setAttribute('id', this.id + 'autocomplete-list');
    a.setAttribute('class', 'autocomplete-items');
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (i = 0; i < arr.length; i++) {
      /*check if the item starts with the same letters as the text field value:*/
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        /*create a DIV element for each matching element:*/
        b = document.createElement('DIV');
        /*make the matching letters bold:*/
        b.innerHTML = '<strong>' + arr[i].substr(0, val.length) + '</strong>';
        b.innerHTML += arr[i].substr(val.length);
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener('click', function (e) {
          /*insert the value for the autocomplete text field:*/
          inp.value = this.getElementsByTagName('input')[0].value;
          /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
          closeAllLists();
        });
        a.appendChild(b);
      }
    }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener('keydown', function (e) {
    let x = document.getElementById(this.id + 'autocomplete-list');
    if (x) x = x.getElementsByTagName('div');
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) {
      //up
      /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add('autocomplete-active');
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (let i = 0; i < x.length; i++) {
      x[i].classList.remove('autocomplete-active');
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
    let x = document.getElementsByClassName('autocomplete-items');
    for (let i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener('click', function (e) {
    closeAllLists(e.target);
  });
}

const getCountriesList = async function () {
  try {
    // Using the same API as the one to get COVID-19 cases so no invalid country is displayed
    const countriesList = await fetch(
      'https://covid-api.mmediagroup.fr/v1/cases'
    )
      .then((e) => e.json())
      .then((data) => data);
    for (const [key, value] of Object.entries(countriesList)) {
      // Excluding countries that do not have basic data
      if (
        value.All.hasOwnProperty('country') &&
        value.All.hasOwnProperty('confirmed') &&
        value.All.hasOwnProperty('recovered') &&
        value.All.hasOwnProperty('deaths') &&
        value.All.hasOwnProperty('population')
      ) {
        countriesListArr.push(key);
      }
    }
  } catch (err) {
    displayErrorMessage('getting list of countries', new Error(err));
  }
};

const init = async function () {
  // Formatting numbers according to user language
  // NOTE: The navigator object contains information about the browser.
  userDefinedNumberFormat = new Intl.NumberFormat(navigator.language);

  await getCountriesList();
  /*initiate the autocomplete function on the "search-bar__input__countryToSearch" element, and pass along the countries array as possible autocomplete values:*/
  autocomplete(
    document.getElementById('search-bar__input__countryToSearch'),
    countriesListArr
  );

  // Hide spinner
  document.querySelector('.spinner').setAttribute('style', 'opacity: 0;');

  // Add new country button
  document
    .querySelector('.search-bar__btn')
    .addEventListener('click', (event) => {
      event.preventDefault();
      let validCountry = 'yes';
      const countryToSearch = document.querySelector(
        '#search-bar__input__countryToSearch'
      ).value;
      // Check if country is valid
      countries.forEach((element) => {
        if (element.countryName === countryToSearch) validCountry = 'no'; // Prevent country repetitions
      });

      if (countriesListArr.indexOf(countryToSearch) === -1) {
        // FIXME await until array is actually built to prevent errors
        displayErrorMessage(
          'country name',
          new Error('Country name not found')
        );
      } else if (validCountry === 'no') {
        // Country already exists
        displayErrorMessage(
          'country name',
          new Error('Country already being displayed')
        );
      } else {
        lockCountrySearch('on');
        buildCountryCard(countryToSearch, userDefinedNumberFormat);
      }
    });

  // Add current country button
  document
    .querySelector('.add-current-country-btn')
    .addEventListener('click', () => {
      // Automatic geolocation
      toggleSpinner('user location', 'on');
      // Prevent user from entering country on search box input
      lockCountrySearch('on');
      // Disable button
      document
        .querySelector('.add-current-country-btn')
        .classList.add('hidden');
      // Get user country
      navigator.geolocation.getCurrentPosition(
        getUserCoords,
        getUserCoordsError,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });

  // Reset button
  let resetButton = document.querySelector('.reset-btn');
  resetButton.addEventListener('click', () => {
    resetButton.classList.add('hidden');
    document
      .querySelectorAll('.full-country-data-container')
      .forEach((element) => element.remove());
    countries.splice(0, countries.length);
    lockCountrySearch();
    // Show 'Add my current country' button
    document
      .querySelector('.add-current-country-btn')
      .classList.remove('hidden');
  });

  // Switch background button
  let switchBackground = true;
  const switchButton = document.querySelector(
    '.switch-background-btn-container'
  );
  switchButton.addEventListener('click', () => {
    const backgroundImageClassList =
      document.querySelector('.background__image').classList;
    while (switchButton.firstChild) {
      switchButton.removeChild(switchButton.firstChild);
    }
    if (switchBackground) {
      backgroundImageClassList.add('hidden');
      const buttonOff = `<div class="switch-background-btn"></div><p>OFF</p>`;
      switchButton.insertAdjacentHTML('afterbegin', buttonOff);
    } else {
      backgroundImageClassList.remove('hidden');
      const buttonOn = `<p>ON</p><div class="switch-background-btn"></div>`;
      switchButton.insertAdjacentHTML('afterbegin', buttonOn);
    }
    switchBackground = !switchBackground;
  });
};

init();

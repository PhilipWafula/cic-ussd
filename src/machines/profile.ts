import {
  BaseContext,
  BaseEvent,
  isOption1,
  isOption2,
  isOption3,
  isOption4,
  isOption5,
  isOption6, isOption9,
  isSuccess,
  MachineId,
  translate,
  updateErrorMessages
} from '@src/machines/utils';
import { createMachine, raise } from 'xstate';
import { Gender, PersonalInformation, upsertPersonalInformation } from '@lib/graph/user';
import { isBlocked, validatePin } from '@machines/auth';
import { MachineError } from '@lib/errors';
import { tHelpers } from '@src/i18n/translator';

enum ProfileError {
  CHANGE_ERROR = "CHANGE_ERROR",
  LOAD_ERROR = "LOAD_ERROR",
}


export const profileMachine = createMachine<BaseContext, BaseEvent>({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOnQFcAXbAewCdcAvAqABTpoDNcAbMAYWzp8MAMQQahEgQBuNANZgyVWg2Yj2XXgKEiwAbQAMAXUSgADjVi5KuSWZAAPRACYAzAA43JAOwBOHwBGQwAWADYXcLcXABoQAE9EDz9AkjdDPxCAVkM3QL8skMCwgF8SuLQsPEJSCmp6JhZNbj5BYTEwOg46EnMedEpOelRlerUmjhaddoMTB0trW3skJ1dPb38g0Iio2ITEEJ8fNKyw9KyfQyOwww8QsoqMHAJiUdVGjUntNr1RTu7ev1BsM3g11Gwvq1dDB9IFTCsFjY7PgHM4EO4vL4AsFwpEzntEggfGcSLcXB4wltAvkUg8QJVnjVQeNPlooTM-l16ICBkM6CM6u9wc1vtCDC54RYrEjlqA0RiNtjtnjonFCX4NSQsh5yX5DFdPIVAnSGdVXoKwRM2WAAGq4MAAd3EkiUsgUSgtLIh1rtjqMkpAiKWKJW8vWWK2uN2asQbiKJBcKTCBTubhuLlK5XpTzNtRUltZU19Tv+3L6vJBno+3qL9od-vm0uDqLWmM2OJ2+JjCE8HixgUuhkTNz1hRNOZeebG1ZFfGLnIB5eB-OZM8htrrsIDQeRLfR4fbyuj+3RgW8hjCWUC5MMhS8eo846qk9XwvX89LPSXfIF+a9s43P0JUbRZd1DRBAhCHUtX1C9-DjNNAg8bsXFyXwcn1LJ1hyHwXCfRlXjAfBKE6FgADF0FQXh4gAOUosBRAAIQAQX4ABpBsESbMC5UQSk-FJWD0huHw8kMQJuyvLJBP1EI3ByOTk0zR5nyZIiSIYEQKKonhaPo0QABUACVmJogBlABJAzOKlUDZVWBB+Jk3ILwNYIJJPM88i1DUzjuB9kx8fDcxIdTSK0yjqLo1AGOM0zLOsuEQJlENeMc-xnOEtzxO7DxUhCDVCvSNwH3cYKXzCzSoG0qL9Li8yrP0YCuLs1KHKc2CXJEsSPMJMI7gTDDTlCJC-DCe4s1NCriPCqAAHFcBkIjorgJjWI4uYWpSvcBzcY5yUgpCPGO28XB8btqU8LUskyZIXDPFwysmic1JmqqFqW-AVtgQyTIa6zNts7bwIQQJtWObJojG47Impc6Tx1ASjnktw4zOPaInK16NJYD7lvon76oSrdkubEGwc1U4MyOSCNTyLJu0vPtikpJDtVGzHntUwi3pYAAZGhMAGZE1vYmzA24+z5SCFwSD8DH+r8Yd5fhwl7uidDTi8B7bxCCaVII0hKv5wXhckX74sawGJdavdUfyEhIfk8IwgiUS3BQ-U+3SM6XG1UIck8LGeZxkQBaF4MLf+kmtrJtL7YEp3Cldt3UZQsGQk1vKMyg8kzuDo3ecLUUZlYAhRY27dJbatE4w8aTs-rq5kzTD3PKTUksl9zwjh1ZTs25wvQ5rEu9DL-Ao+J62dyl2NwlSFXRJ8PKaQZk9xsMa7Mj2gpkc5g2QuN4u5zrceK-Fmea6SG45dTHV8l7v3uz27wMPEm6wZutMC9CouR5Px0Z8iZWyrrbcmucYL6n4ghMISFn6iUge-FIWQv79ymtjWaABNAA8oxc+09q47SXgmPKRRjonS7qrCClJM4oLOp-IIfgvCPi5obX+w8cF4OAQDUBwM0oKgjB2FUBJXC5DCCQDwQ5cKSPSD4Q4+sB5sKPlAThk9GpJVjjxByAjDxRi7J5Aq3h+o3DRqhSGWQf7KNUdwpqvC47aIPEqPRqpPL9UzvXehkjcg6jcD-WQ6AeC4AgHNIiEBOjYPMJHIyABRYymCL6EPJqJTewQAg5GTEOckyFPJQ18BmAcfsxo3SegfF8-jAkQHDmbfA0TiJ0HiKIGJcSElgPjocPsG9+owxyCI08oRBpawyLePKfj8AyACUElajTYlGXiQQ1pDlILQTftAxScCTyXA6a7XCXTkbHVGeMip49WD8Gmc0+ZfCHIJ0dlhZ2Kczpp08kOTekjboFTylhfZrCQrlKCccm0ZzZktMuWiDqQlXKiXcs-dwzlm4ZB8FeUIByJkQE4bUyg9TAVzLsVo6Wt5fCu1gpCjwVDQZnEzvJM6GRApMNyD-cw64ACyRFyD4JxbPdKAlOpZUhTlTyWFUiSN9u4fwdM0EvVeAy60zL8CspsRc+xoKMrcohT1C64ljivKguklySF6VMpZWoxK7Kr6csyqqqFBi8ppCkZBK4RQrz6ulYamxzUgaKr4sq8F3VLWEgHAUG19CAiRD1FBJ1UwZVyr+sTNwJq9xgv1DytVJ5HpYRguDSIJUla3nDdoSNRr9AhDjSDBNXVsq9QOONRB8l8geMuL475L5YBgD4JgWwIgQn4DCXQNlpNcXX03kwuS98AjLyfgYs6116GXCyRePCjamTNtbe2+aoTOgFoVf20GECVnwTWdkv1clN47NGqhHURwFHoNeEusAbbcZrp7TYjR7qt1LNlru+W+6LqjU7pkNJ+QLynB-jeu9HaH0FrdTbEFEEd2wVWYhA9EFPCb0erA15Q45IFTKFmfANAwnwBWFeogfaOUAFowjdnI7CzqnU5I-ywJgGg5BiKMR4ILRQEASOmoOhDW5kRhljTboScIm8CoFAKpeaIqGG2lKZFWN81ofgwC4ztAostNgXjTEOAIQnEBK3ESVRMZ47gpxCPO2T5o-xrh9HWFT5MKSpA03IjVUmUJ6kdizOmI1XYBB-jgGY0SuR0Ds-wvKvHUb8e1IJ7sxJUjpEyGZ6kgGEU-wgLgWA5Z4hWimCF7RYWbkRZCAJs4z9ij9kVnrc9y9LF-xqrpFauXa6Jl8EhI4zy5EoJKzk-pzcwZyMyDkPwNXh54y+gTRrEEHMRntS5x6uUYWGYKNecI2pDjDdmlU+xl89zDkzgNrC4RtYmfTtSQSFw0x3CK-LCxC6Q6zQAkpsA48Js9lgZvaIOobpDiwrhNefrijHHi1BJbZ1khBVu0Pe775T4EBe+5WWKQivuzBzqEIz8rzoX1O4VGx0xqXolZDqqnC4fZtJKJAIY1ULiSYRdS8sshWXARZeRn4rB7SDGSizt3aIlbcSWlJCsDpvOd2nN7rAlXk5AB7W3CyKKmbeROi+pL3ELvbzl9v2e1x1q1uBSkqVxigai7rLyZ9EXtFOraJKlV5EOOXkpj0IxILiJgyMbiAxz+AvZ4wV6IRWotdfVLhG1mRHdjXlnkV3-yXtmZQjkUkXgPs7x9q7V3aK6mEhfRyr3TtIvJH99QyCjstM93dh1n+bH0AQEC90T3+Xs++9z7p08qQjP1ovGZtJub2R6DMuQTAmA4AEYz9x2vfH6-RYRq7CRGQzP+SiNViHvQDWyuV95e6JLcJniKI8tW+Rdf0JQbkS4xoF8gZXVzzoZuEVpHvLha7VK-AXV91P+-mSsJ0pP2ASgK7YCRrN5eC30Qlw1uF0OQfYDOqMcYGQkQLCZQQAA */
  id: MachineId.PROFILE,
  initial: 'profileMenu',
  predictableActionArguments: true,
  states: {
    accountBlocked: {
      description: 'Account is blocked.',
      tags: 'error',
      type: 'final'
    },
    authorizingProfileChange: {
      description: 'Invoked service that authorizes the profile change.',
      invoke: {
        id: 'authorizingProfileChange',
        src: 'initiateProfileChange',
        onDone: { target: 'profileChangeSuccess', cond: 'isSuccess' },
        onError: [
          { target: 'accountBlocked', cond: 'isBlocked', actions: 'updateErrorMessages' },
          { target: 'changeError', cond: 'isChangeError', actions: 'updateErrorMessages' },
          { target: 'invalidPinPC', actions: 'updateErrorMessages' }
        ]
      },
      tags: 'invoked'
    },
    authorizingProfileView: {
      description: 'Invoked service that authorizes viewing the account\'s personal information.',
      invoke: {
        id: 'authorizingProfileView',
        src: 'loadPersonalInformation',
        onDone: { target: 'displayingProfile', cond: 'isSuccess' },
        onError: [
          { target: 'accountBlocked', cond: 'isBlocked' },
          { target: 'loadError', cond: 'isLoadError', actions: 'updateErrorMessages' },
          { target: 'invalidPinPV' }
        ]
      },
      tags: 'invoked'
    },
    changeError: {
      description: 'Error changing profile.',
      tags: 'error',
      type: 'final'
    },
    displayingProfile: {
      description: 'Displays the account\'s profile.',
      tags: 'resolved',
      type: 'final'
    },
    enteringFamilyName: {
      description: 'Expects family name.',
      on: {
        BACK: 'enteringGivenNames',
        TRANSIT: [
          { target: 'selectingGender', cond: 'genderAbsent', actions: 'saveFamilyName' },
          { target: 'enteringProfileChangePin', cond: 'isValidName', actions: 'saveFamilyName' },
          { target: 'invalidName' }
        ]
      }
    },
    enteringGivenNames: {
      description: 'Expect given names.',
      on: {
        BACK: 'profileMenu',
        TRANSIT: [
          { target: 'enteringFamilyName', cond: 'isValidName', actions: 'saveGivenNames' },
          { target: 'invalidName' }
        ]
      }
    },
    enteringLocation: {
      description: 'Expects a valid location.',
      on: {
        BACK: 'profileMenu',
        TRANSIT: [
          { target: 'enteringProfileChangePin', cond: 'isValidLocation', actions: 'saveLocation' },
          { target: 'invalidLocationEntry' }
        ]
      }
    },
    enteringProfileChangePin: {
      description: 'Expects valid PIN matching account\'s PIN.',
      on: {
        BACK: 'profileMenu',
        TRANSIT: 'authorizingProfileChange'
      },
      tags: 'error'
    },
    enteringProfileViewPin: {
      description: 'Expects valid PIN matching account\'s PIN.',
      on: {
        BACK: 'profileMenu',
        TRANSIT: 'authorizingProfileView'
      },
      tags: 'error'
    },
    enteringYOB: {
      description: 'Expects a valid year of birth. > 1900 and < current year.',
      on: {
        BACK: 'profileMenu',
        TRANSIT: [
          { target: 'enteringLocation', cond: 'locationAbsent', actions: 'saveYOB' },
          { target: 'enteringProfileChangePin', cond: 'isValidYOB', actions: 'saveYOB' },
          { target: 'invalidYOBEntry' }
        ]
      }
    },
    exit: {
      description: 'Terminates USSD session.',
      type: 'final'
    },
    invalidGenderOption: {
      description: 'Selected gender option is invalid. Raises a RETRY event to prompt user to retry gender selection.',
      entry: raise({ type: 'RETRY', feedback: 'inValidGenderOption' }),
      on: {
        RETRY: 'selectingGender'
      }
    },
    invalidLocationEntry: {
      description: 'Entered location is invalid. Raises a RETRY event to prompt user to retry location entry.',
      entry: raise({ type: 'RETRY', feedback: 'inValidLocationOption' }),
      on: {
        RETRY: 'enteringLocation'
      }
    },
    invalidName: {
      description: 'Entered name is invalid. Raises a RETRY event to prompt user to retry name entry.',
      entry: raise({ type: 'RETRY', feedback: 'inValidName' }),
      on: {
        RETRY: 'enteringGivenNames'
      }
    },
    invalidPinPC: {
      description: 'Entered PIN is invalid. Raises a RETRY event to prompt user to retry PIN entry.',
      entry: raise({ type: 'RETRY', feedback: 'invalidPinPC' }),
      on: {
        RETRY: 'enteringProfileChangePin'
      }
    },
    invalidPinPV: {
      description: 'Entered PIN is invalid. Raises a RETRY event to prompt user to retry PIN entry.',
      entry: raise({ type: 'RETRY', feedback: 'invalidPinPV' }),
      on: {
        RETRY: 'enteringProfileViewPin'
      },
      tags: 'error'
    },
    invalidYOBEntry: {
      description: 'Entered year of birth is invalid. Raises a RETRY event to prompt user to retry year of birth entry.',
      entry: raise({ type: 'RETRY', feedback: 'inValidYOBOption' }),
      on: {
        RETRY: 'enteringYOB'
      }
    },
    loadError: {
      description: 'Error loading profile.',
      tags: 'error',
      type: 'final'
    },
    profileChangeSuccess: {
      description: 'Profile change successful.',
      on: {
        BACK: 'settingsMenu',
        TRANSIT: { target: 'exit', cond: 'isOption9' }
      },
      tags: 'resolved',
    },
    profileMenu: {
      description: 'Displays the profile menu.',
      on: {
        BACK: 'settingsMenu',
        TRANSIT: [
          { target: 'enteringGivenNames', cond: 'isOption1' },
          { target: 'selectingGender', cond: 'isOption2' },
          { target: 'enteringYOB', cond: 'isOption3' },
          { target: 'enteringLocation', cond: 'isOption4' },
          { target: 'enteringProfileViewPin', cond: 'isOption5' }
        ]
      }
    },
    selectingGender: {
      description: 'Expects user to enter a valid option from the provided gender options.',
      on: {
        BACK: 'profileMenu',
        TRANSIT: [
          { target: 'enteringYOB', cond: 'YOBAbsent', actions: 'saveGender' },
          { target: 'enteringProfileChangePin', cond: 'isValidGender' },
          { target: 'invalidGenderOption' }
        ]
      }
    },
    settingsMenu: {
      description: 'Displays the settings menu.',
      type: 'final'
    }
  }
}, {
  guards: {
    YOBAbsent,
    genderAbsent,
    isBlocked,
    isChangeError,
    isLoadError,
    isOption1,
    isOption2,
    isOption3,
    isOption4,
    isOption5,
    isOption6,
    isOption9,
    isSuccess,
    isValidGender,
    isValidLocation,
    isValidName,
    isValidYOB,
    locationAbsent
  },
  actions: {
    saveFamilyName,
    saveGender,
    saveGivenNames,
    saveLocation,
    saveYOB,
    updateErrorMessages
  },
  services: {
    initiateProfileChange,
    loadPersonalInformation
  }
});

async function initiateProfileChange(context: BaseContext, event: any) {
  const { resources: { graphql, p_redis }, user: { account: { address, phone_number }, graph: { id: graphUserId }} } = context
  const { input } = event
  const { personal_information } = context.data

  await validatePin(context, input)

  try {
    let updatedProfile: Partial<PersonalInformation> = {
      ...personal_information,
      user_identifier: graphUserId
    }
    await upsertPersonalInformation(address, graphql, updatedProfile, phone_number, p_redis)
    return { success: true }
  } catch (error) {
    throw new MachineError(ProfileError.CHANGE_ERROR, error.message)
  }
}

function isLoadError(_, event: any) {
  return event.data.code === ProfileError.LOAD_ERROR
}

function isChangeError(_, event: any) {
  return event.data.code === ProfileError.CHANGE_ERROR
}

function isValidName(context: BaseContext , event: any) {
  return /^[A-Z][a-z]+([][A-Z][a-z]+)?$/.test(event.input)
}

function saveFamilyName(context: BaseContext , event: any) {
  context.data = {
    ...(context.data || {}),
    personal_information: {
      ...(context.data.personal_information || {}),
      family_name: event.input
    }
  }
  return context
}

function saveGivenNames(context: BaseContext , event: any) {
  context.data = {
    ...(context.data || {}),
    personal_information: {
      ...(context.data?.personal_information || {}),
      given_names: event.input
    }
  }
  return context
}

function isValidGender(context: BaseContext , event: any) {
  return event.input === "1" || event.input === "2"
}

function saveGender(context: BaseContext , event: any) {
  context.data = {
    ...(context.data || {}),
    personal_information: {
      ...(context.data?.personal_information || {}),
      gender: event.input === "1" ? Gender.MALE : Gender.FEMALE
    }
  }
  return context
}

function isValidYOB(context: BaseContext , event: any) {
  const year = parseInt(event.input)
  if (isNaN(year)) return false
  return year >= 1900 && year <= 2100;
}

function saveYOB(context: BaseContext , event: any) {
  context.data = {
    ...(context.data || {}),
    personal_information: {
      ...(context.data?.personal_information || {}),
      year_of_birth: parseInt(event.input)
    }
  }
  return context
}

function isValidLocation(context: BaseContext , event: any) {
  return /^[a-zA-Z\s]*$/.test(event.input)
}

function saveLocation(context: BaseContext , event: any) {
  context.data = {
    ...(context.data || {}),
    personal_information: {
      ...(context.data?.personal_information || {}),
      location_name: event.input
    }
  }
  return context
}

function genderAbsent(context: BaseContext) {
  const gender = context.user?.graph?.personal_information?.gender;
  return gender === null || gender === undefined;
}

function YOBAbsent(context: BaseContext) {
  const yob = context.user?.graph?.personal_information?.year_of_birth;
  return yob === null || yob === undefined;
}

function locationAbsent(context: BaseContext) {
  const location = context.user?.graph?.personal_information?.location_name;
  return location === null || location === undefined;
}

async function loadPersonalInformation(context: BaseContext, event: any) {
  const { input } = event
  await validatePin(context, input)

  return { success: true }
}

export async function profileTranslations(context: BaseContext, state: string, translator: any) {
  const { language } = context.user.account;

  if (state === "displayingProfile") {
    const notProvided = tHelpers("notProvided", language);
    const { user } = context;
    const given_names = user.graph?.personal_information?.given_names;
    const family_name = user.graph?.personal_information?.family_name;
    const genderSelection = user.graph?.personal_information?.gender?.toLowerCase();
    const gender = tHelpers(genderSelection, language)
    const year_of_birth = user.graph?.personal_information?.year_of_birth;
    const location_name = user.graph?.personal_information?.location_name;
    const name = given_names && family_name ? `${given_names} ${family_name}` : notProvided;
    return await translate(state, translator, {
      name: `${tHelpers("name", language)} ${name || notProvided}`,
      gender: `${tHelpers("gender", language)} ${gender || notProvided}`,
      age: `${tHelpers("age", language)} ${year_of_birth ? new Date().getFullYear() - year_of_birth : notProvided}`,
      location: `${tHelpers("location", language)} ${location_name || notProvided}`
    });
  }
  return await translate(state, translator);
}